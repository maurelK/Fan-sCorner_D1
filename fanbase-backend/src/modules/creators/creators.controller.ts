import {
  Controller,
  Get,
  Patch,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CreatorsService } from './creators.service';
import { UpdateCreatorProfileDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Creators')
@Controller('creators')
export class CreatorsController {
  constructor(private readonly creatorsService: CreatorsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all creators' })
  findAll() {
    return this.creatorsService.findAll();
  }

  @Get('my-stats')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current creator stats' })
  getMyStats(@Request() req) {
    return this.creatorsService.getCreatorStats(req.user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get creator by ID' })
  findOne(@Param('id') id: string) {
    return this.creatorsService.findOne(id);
  }

  @Patch('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update creator profile' })
  updateProfile(@Request() req, @Body() updateDto: UpdateCreatorProfileDto) {
    return this.creatorsService.updateProfile(req.user.id, updateDto);
  }
}
