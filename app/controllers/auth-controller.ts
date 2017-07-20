import * as util from 'util';
import * as Bunyan from 'bunyan';
import * as passport from 'passport';
import { BasicStrategy } from 'passport-http';
import { Strategy as JwtStrategy, ExtractJwt, StrategyOptions } from 'passport-jwt';
import { Types, IOC, Decorators, LogProvider } from '../../core';
import { sign, SignOptions } from 'jsonwebtoken';
import { stdoutLogger } from '../../config/logger';
import { UserModelFactory } from '../models/user.model';

interface ICredentials {
    username: string;
    password: string;
    provider: string;
}

@Decorators.autobind
export class AuthController implements Types.AuthGuard {
    private config: Types.ServerConfig;
    private logger: Bunyan;

    constructor (
        @IOC.Inject config: Types.ServerConfig,
        @IOC.Inject logProvider: LogProvider
    ) {
        this.config = config;
        this.logger = logProvider.factory(stdoutLogger);
    }

    initialize (options?: any): Function {
        let opts: StrategyOptions = {
            jwtFromRequest: this.extractJwt,
            secretOrKey: this.config.secretKey
        };
        passport.use('jwt', new JwtStrategy(opts, function (payload, done) {
            done(undefined, payload);
        }));
        return passport.initialize();
    }

    extractJwt(req): string {
        let jwt = ExtractJwt.fromAuthHeader()(req);
        return jwt;
    }

    authenticate (): Function {
        return passport.authenticate('jwt', {session: false});
    }

    authorize (req, res, next) {
        let credentials: ICredentials;

        try {
            credentials = this.getCredentials(req);
        } catch (ex) {
            if(ex.message === 'Credentials Required') {
                res.header('WWW-Authenticate', 'Basic');
                res.send(401, 'Unauthorized');
                return;
            } else {
                res.send(401, 'Unauthorized');
            }
        }

        let UserModel = UserModelFactory();
        UserModel.findOne({
            where: {email: credentials.username, password: credentials.password}
        }).then((user: any) => {
            if (!user) {
                if (credentials.provider === 'Facebook') {
                    UserModel.create({
                        email: credentials.username,
                        password: credentials.password
                    }).then((newUser: any) => {
                        let token = this.signToken(newUser);
                        res.send(200, token);
                        next();
                    });
                } else {
                    res.send(401, 'Unauthorized');
                    next();
                }
            } else {
                let token = this.signToken(user);
                res.send(200, token);
                next();
            }
        });
    }

    private getCredentials (req): ICredentials {
        let provider = req.headers['x-login-provider'];
        if (provider === undefined) {
            throw new Error ('Invalid request. Login provider is required.');
        }
        let auth = req.authorization.basic;
        if (!auth) {
            throw new Error ('Credentials Required');
        }
        let {username, password} = auth;
        this.logger.info({user: auth});

        return {username, password, provider};
    }

    private signToken (user: any): string {
        let signOptions: SignOptions = {
            // expiresIn: '1m'
        };
        let token = sign({user: user.id}, this.config.secretKey, signOptions);
        return token;
    }
}