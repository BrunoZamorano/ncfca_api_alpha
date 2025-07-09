import { Body, Controller, Post, Patch, UseGuards, Request, HttpCode, HttpStatus } from '@nestjs/common';

import RegisterUser from '@/application/use-cases/register-user/register-user';
import EditUserProfile from '@/application/use-cases/edit-user-profile/edit-user-profile';
import ChangeUserPassword from '@/application/use-cases/change-user-password/change-user-password';

import { RegisterUserInputDto, RegisterUserOutputDto } from '@/infraestructure/dtos/register-user.dto';

import AuthGuard from '@/shared/guards/auth.guard';
import { UpdateProfileDto } from '@/infraestructure/dtos/update-profile.dto';
import { ChangePasswordDto } from '@/infraestructure/dtos/change-password.dto';

@Controller('/account')
export default class AccountController {
  constructor(
    private readonly _registerUser: RegisterUser,
    private readonly _editUserProfile: EditUserProfile,
    private readonly _changeUserPassword: ChangeUserPassword,
  ) {}

  @Post('/user')
  async registerUser(@Body() input: RegisterUserInputDto): Promise<RegisterUserOutputDto> {
    return await this._registerUser.execute(input);
  }

  @Patch('/profile')
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async updateProfile(@Request() req: any, @Body() body: UpdateProfileDto): Promise<void> {
    const loggedInUserId = req.user.id;
    await this._editUserProfile.execute({ ...body, id: loggedInUserId });
  }

  @Post('/change-password')
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async changePassword(@Request() req: any, @Body() body: ChangePasswordDto): Promise<void> {
    const loggedInUserId = req.user.id;
    await this._changeUserPassword.execute({
      id: loggedInUserId,
      password: body.oldPassword,
      newPassword: body.newPassword,
    });
  }
}
