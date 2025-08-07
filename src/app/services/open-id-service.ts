import { inject, Injectable } from '@angular/core';
import { AssertInternalError, MultiEvent } from '@pbkware/js-utils';
import { SessionInfoService } from '@plxtra/motif-core';
import { User, UserManager, UserManagerSettings, UserProfile } from 'oidc-client-ts';
import { AuthenticationError } from '../errors/authentication.error';
import { ErrorIndicator } from '../errors/error-indicator';
import { ConfigurationService } from './configuration.service';
import { UnifyService } from './unify.service';

@Injectable({
  providedIn: 'root'
})
export class OpenIdService {
  public authenticationCompletedEventer: OpenIdService.AuthenticationCompletedEventer;
  public userLoadedEventer: OpenIdService.UserLoadedEventer;
  public accessTokenExpiredEventer: OpenIdService.AccessTokenExpiredEventer;
  public silentRenewErrorEventer: OpenIdService.SilentRenewErrorEventer;

  private readonly _configurationService = inject(ConfigurationService);

  private readonly _sessionInfoService: SessionInfoService;

  private _userManager?: UserManager;
  private _token_type = '';
  private _access_token = OpenIdService.invalidAccessToken;
  private _username?: string;
  private _userFullName?: string;
  private _userId: string;
  private _userEmail?: string;

  private _userLoadedMultiEvent = new MultiEvent<OpenIdService.UserLoadedEventHandler>();

  constructor() {
    const unifyService = inject(UnifyService);
    this._sessionInfoService = unifyService.sessionInfoService;
  }

  get accessToken() { return this._access_token; }

  public get username(): string {
    return this._username ?? "";
  }
  public set username(v: string) {
    if (v !== this._username) {
      this._username = v;
      this._sessionInfoService.username = v;
    }
  }

  public get fullname(): string {
    return this._userFullName ?? "";
  }
  public set fullname(v: string) {
    if (v !== this._userFullName) {
      this._userFullName = v;
      this._sessionInfoService.userFullName = v;
    }
  }

  public get userID(): string {
    return this._userId;
  }
  public set userID(v: string) {
    if (v !== this._userId) {
      this._userId = v;
      this._sessionInfoService.userId = v;
    }
  }

  public get userEmail(): string {
    return this._userEmail ?? "";
  }
  public set userEmail(v: string) {
    if (v !== this._userEmail) {
      this._userEmail = v;
    }
  }

  isLoggedIn(): boolean {
    return this._access_token !== OpenIdService.invalidAccessToken;
  }

  getAuthorizationHeaderValue(): string {
    if (this._access_token === OpenIdService.invalidAccessToken)
      throw new AuthenticationError(ErrorIndicator.AE227157476, 'Access Token not available');
    return `${this._token_type} ${this._access_token}`;
  }

  startAuthentication(url: string) {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (this._configurationService.config === undefined)
      throw new AuthenticationError(ErrorIndicator.AE213916000, 'Config not available');

    window.arclightLogger.logInfo(`Starting authentication cycle. ReturnURL: ${ url}`);
    const customState: OpenIdService.CustomState = { returnUrl: url };
    this._userManager = this.createUserManager();
    this._userManager.events.addUserLoaded((user) => this.processUserLoaded(user));
    this._userManager.events.addAccessTokenExpired(() => this.processAccessTokenExpired());
    const signinRedirectPromise = this._userManager.signinRedirect({ state: customState });
    AssertInternalError.throwErrorIfPromiseRejected(signinRedirectPromise, 'Failed Signin Redirect authentication');
  }

  async completeAuthentication() {
    this._userManager = this.createUserManager();
    this._userManager.events.addUserLoaded((user) => this.processUserLoaded(user));
    this._userManager.events.addAccessTokenExpired(() => this.processAccessTokenExpired());
    const user = await this._userManager.signinRedirectCallback();
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (user === undefined || user === null) {
      throw new AuthenticationError(ErrorIndicator.AE186345013, `OIDC UserManager returned null or undefined user`);
    } else {
      this._userManager.events.addSilentRenewError((error) => this.handleSilentRenewError(error));
      this.authenticationCompletedEventer(user);
    }
  }

  async clearUserState() {
    this._access_token = OpenIdService.invalidAccessToken;
    await this._userManager?.removeUser();
  }

  public async signOut() {
    this._userManager = this.createUserManager();
    await this._userManager.signoutRedirect();
  }

  subscribeUserLoadedEvent(handler: OpenIdService.UserLoadedEventHandler) {
    return this._userLoadedMultiEvent.subscribe(handler);
  }

  unsubscribeUserLoadedEvent(subscriptionId: MultiEvent.SubscriptionId) {
    this._userLoadedMultiEvent.unsubscribe(subscriptionId);
  }

  private createUserManager() {
    const settings: UserManagerSettings = {
      authority: this._configurationService.config.openId.authority,
      client_id: this._configurationService.config.openId.clientId,
      redirect_uri: this._configurationService.config.openId.redirectUri,
      post_logout_redirect_uri: this._configurationService.config.openId.postLogoutRedirectUri,
      response_type: 'code',
      scope: this._configurationService.config.openId.scope,
      automaticSilentRenew: true,
      silent_redirect_uri: this._configurationService.config.openId.silentRedirectUri,
      filterProtocolClaims: true,
      loadUserInfo: true,
    };

    return new UserManager(settings);
  }

  private processUserLoaded(user: User) {
    this._access_token = user.access_token;
    this._token_type = user.token_type;

    const profile = user.profile as OpenIdService.UserProfileWithDetails;
    this.userID = profile.sub;
    this.username = profile.preferred_username;
    this.fullname = profile.name;
    this.userEmail = profile.email;

    this.notifyUserLoaded();
  }

  private processAccessTokenExpired() {
    this._access_token = OpenIdService.invalidAccessToken;
    this.accessTokenExpiredEventer();
  }

  private handleSilentRenewError(error: Error) {
    window.arclightLogger.logError(`Silent renew: ${error}`);
    this.silentRenewErrorEventer();
  }

  private notifyUserLoaded() {
    const handlers = this._userLoadedMultiEvent.copyHandlers();
    for (let i = 0; i < handlers.length; i++) {
      handlers[i](this._userId);
    }
  }
}

export namespace OpenIdService {
  export type AuthenticationCompletedEventer = (this: void, user: User) => void;
  export type UserLoadedEventer = (this: void) => void;
  export type AccessTokenExpiredEventer = (this: void) => void;
  export type SilentRenewErrorEventer = (this: void) => void;
  export type UserLoadedEventHandler = (userId: string) => void;
  export const invalidAccessToken = '';

  export interface UserProfileWithDetails extends UserProfile {
    preferred_username: string,
    name: string,
    email: string
  }


  export interface CustomState {
    returnUrl: string;
  }
}
