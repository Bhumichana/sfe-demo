import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto, DemoLoginDto } from './dto/login.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  @ApiOperation({ summary: 'Login with username and password' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Post('demo')
  @ApiOperation({ summary: 'Demo mode login (no password required)' })
  @ApiResponse({ status: 200, description: 'Demo login successful' })
  @ApiResponse({ status: 401, description: 'Demo user not found' })
  async loginDemo(@Body() demoLoginDto: DemoLoginDto) {
    return this.authService.loginDemo(demoLoginDto);
  }

  @Post('logout')
  @ApiOperation({ summary: 'Logout' })
  @ApiResponse({ status: 200, description: 'Logout successful' })
  async logout() {
    // For now, just return success
    // In real implementation, would invalidate token/session
    return { message: 'Logout successful' };
  }
}
