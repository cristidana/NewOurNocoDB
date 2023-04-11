import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Request,
  Response,
  UseGuards,
} from '@nestjs/common';
import { promisify } from 'util';
import { NcError } from '../../helpers/catchError';
import { Acl, ExtractProjectIdMiddleware } from '../../middlewares/extract-project-id/extract-project-id.middleware'
import Noco from '../../Noco';
import extractRolesObj from '../../utils/extractRolesObj';
import { genJwt, randomTokenString, setTokenCookie } from './helpers';
import { UsersService } from './users.service';

import * as ejs from 'ejs';
import { Audit, User } from '../../models';
import { AuthGuard } from '@nestjs/passport';
@Controller()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post([
    '/auth/user/signup',
    '/api/v1/db/auth/user/signup',
    '/api/v1/auth/user/signup',
  ])
  async signup(@Request() req: any, @Request() res: any): Promise<any> {
    return await this.usersService.signup({
      body: req.body,
      req,
      res,
    });
  }

  @Post([
    '/auth/token/refresh',
    '/api/v1/db/auth/token/refresh',
    '/api/v1/auth/token/refresh',
  ])
  async refreshToken(@Request() req: any, @Request() res: any): Promise<any> {
    return await this.usersService.refreshToken({
      body: req.body,
      req,
      res,
    });
  }

  async successfulSignIn({ user, err, info, req, res, auditDescription }) {
    try {
      if (!user || !user.email) {
        if (err) {
          return res.status(400).send(err);
        }
        if (info) {
          return res.status(400).send(info);
        }
        return res.status(400).send({ msg: 'Your signin has failed' });
      }

      await promisify((req as any).login.bind(req))(user);

      const refreshToken = randomTokenString();

      if (!user.token_version) {
        user.token_version = randomTokenString();
      }

      await User.update(user.id, {
        refresh_token: refreshToken,
        email: user.email,
        token_version: user.token_version,
      });
      setTokenCookie(res, refreshToken);

      await Audit.insert({
        op_type: 'AUTHENTICATION',
        op_sub_type: 'SIGNIN',
        user: user.email,
        ip: req.clientIp,
        description: auditDescription,
      });

      res.json({
        token: genJwt(user, Noco.getConfig()),
      } as any);
    } catch (e) {
      console.log(e);
      throw e;
    }
  }

  @Post([
    '/auth/user/signin',
    '/api/v1/db/auth/user/signin',
    '/api/v1/auth/user/signin',
  ])
  @UseGuards(AuthGuard('local'))
  async signin(@Request() req) {
    return this.usersService.login(req.user);
  }

  @Post(`/auth/google/genTokenByCode`)
  async googleSignin(req, res, next) {
    // todo
    /* passport.authenticate(
      'google',
      {
        session: false,
        callbackURL: req.ncSiteUrl + Noco.getConfig().dashboardPath,
      },
      async (err, user, info): Promise<any> =>
        await successfulSignIn({
          user,
          err,
          info,
          req,
          res,
          auditDescription: 'signed in using Google Auth',
        })
    )(req, res, next);*/
  }

  @Get('/auth/google')
  googleAuthenticate() {
    /*    passport.authenticate('google', {
      scope: ['profile', 'email'],
      state: req.query.state,
      callbackURL: req.ncSiteUrl + Noco.getConfig().dashboardPath,
    })(req, res, next)*/
  }

  @Get(['/auth/user/me', '/api/v1/db/auth/user/me', '/api/v1/auth/user/me'])
  @UseGuards(ExtractProjectIdMiddleware, AuthGuard('jwt'))
  async me(@Request() req) {
    const user = {
      ...req.user,
      roles: extractRolesObj(req.user.roles),
    };
    return user;
  }

  @Post([
    '/user/password/change',
    '/api/v1/db/auth/password/change',
    '/api/v1/auth/password/change',
  ])
  @Acl('passwordChange')
  async passwordChange(@Request() req: any, @Body() body: any): Promise<any> {
    if (!(req as any).isAuthenticated()) {
      NcError.forbidden('Not allowed');
    }

    await this.usersService.passwordChange({
      user: req['user'],
      req,
      body: req.body,
    });

    return { msg: 'Password has been updated successfully' };
  }

  @Post([
    '/auth/password/forgot',
    '/api/v1/db/auth/password/forgot',
    '/api/v1/auth/password/forgot',
  ])
  async passwordForgot(@Request() req: any, @Body() body: any): Promise<any> {
    await this.usersService.passwordForgot({
      siteUrl: (req as any).ncSiteUrl,
      body: req.body,
      req,
    });

    return { msg: 'Please check your email to reset the password' };
  }

  @Post([
    '/auth/token/validate/:tokenId',
    '/api/v1/db/auth/token/validate/:tokenId',
    '/api/v1/auth/token/validate/:tokenId',
  ])
  async tokenValidate(@Param('tokenId') tokenId: string): Promise<any> {
    await this.usersService.tokenValidate({
      token: tokenId,
    });
    return { msg: 'Token has been validated successfully' };
  }

  @Post([
    '/auth/password/reset/:tokenId',
    '/api/v1/db/auth/password/reset/:tokenId',
    '/api/v1/auth/password/reset/:tokenId',
  ])
  async passwordReset(
    @Request() req: any,
    @Param('tokenId') tokenId: string,
    @Body() body: any,
  ): Promise<any> {
    await this.usersService.passwordReset({
      token: tokenId,
      body: body,
      req,
    });

    return { msg: 'Password has been reset successfully' };
  }

  @Post([
    '/api/v1/db/auth/email/validate/:tokenId',
    '/api/v1/auth/email/validate/:tokenId',
  ])
  async emailVerification(
    @Request() req: any,
    @Param('tokenId') tokenId: string,
  ): Promise<any> {
    await this.usersService.emailVerification({
      token: tokenId,
      req,
    });

    return { msg: 'Email has been verified successfully' };
  }

  @Get([
    '/api/v1/db/auth/password/reset/:tokenId',
    '/auth/password/reset/:tokenId',
  ])
  async renderPasswordReset(
    @Request() req: any,
    @Response() res: any,
    @Param('tokenId') tokenId: string,
  ): Promise<any> {
    try {
      res.send(
        ejs.render((await import('./ui/auth/resetPassword')).default, {
          ncPublicUrl: process.env.NC_PUBLIC_URL || '',
          token: JSON.stringify(tokenId),
          baseUrl: `/`,
        }),
      );
    } catch (e) {
      return res.status(400).json({ msg: e.message });
    }
  }
}
