import { Body, Controller, Post, Patch, UseGuards, Request, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import RegisterUser from '@/application/use-cases/register-user/register-user';
import EditUserProfile from '@/application/use-cases/edit-user-profile/edit-user-profile';
import ChangeUserPassword from '@/application/use-cases/change-user-password/change-user-password';
import { RegisterUserInputDto, RegisterUserOutputDto } from '@/infraestructure/dtos/register-user.dto';
import AuthGuard from '@/shared/guards/auth.guard';
import { UpdateProfileDto } from '@/infraestructure/dtos/update-profile.dto';
import { ChangePasswordDto } from '@/infraestructure/dtos/change-password.dto';

@ApiTags('Conta de Usuário')
@Controller('/account')
export default class AccountController {
  constructor(
    private readonly _registerUser: RegisterUser,
    private readonly _editUserProfile: EditUserProfile,
    private readonly _changeUserPassword: ChangeUserPassword,
  ) {}

  @Post('/user')
  @ApiOperation({ summary: 'Registra um novo usuário (responsável familiar)' })
  @ApiResponse({
    status: 201,
    description: 'Usuário registrado com sucesso, retorna tokens.',
    type: RegisterUserOutputDto,
  })
  @ApiResponse({ status: 400, description: 'Dados de entrada inválidos ou email/CPF já em uso.' })
  async registerUser(@Body() input: RegisterUserInputDto): Promise<RegisterUserOutputDto> {
    return await this._registerUser.execute(input);
  }

  @Patch('/profile')
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Atualiza o perfil do usuário autenticado' })
  @ApiResponse({ status: 204, description: 'Perfil atualizado com sucesso.' })
  @ApiResponse({ status: 400, description: 'Dados de entrada inválidos.' })
  @ApiResponse({ status: 401, description: 'Não autorizado.' })
  async updateProfile(@Request() req: any, @Body() body: UpdateProfileDto): Promise<void> {
    const loggedInUserId = req.user.id;
    await this._editUserProfile.execute({ ...body, id: loggedInUserId });
  }

  @Post('/change-password')
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Altera a senha do usuário autenticado' })
  @ApiResponse({ status: 204, description: 'Senha alterada com sucesso.' })
  @ApiResponse({ status: 400, description: 'Dados de entrada inválidos ou nova senha igual à antiga.' })
  @ApiResponse({ status: 401, description: 'Não autorizado.' })
  async changePassword(@Request() req: any, @Body() body: ChangePasswordDto): Promise<void> {
    const loggedInUserId = req.user.id;
    await this._changeUserPassword.execute({
      id: loggedInUserId,
      password: body.oldPassword,
      newPassword: body.newPassword,
    });
  }
}
