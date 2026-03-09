import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SubscriptionsService } from './subscriptions.service';
import { CreateSubscriptionDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Subscriptions')
@Controller('subscriptions')
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Subscribe to a creator' })
  create(@Request() req, @Body() createDto: CreateSubscriptionDto) {
    return this.subscriptionsService.create(req.user.id, createDto);
  }

  @Get('check')
  @ApiOperation({ summary: 'Check if fan is subscribed to creator' })
  checkSubscription(
    @Query('email') email: string,
    @Query('creatorId') creatorId: string,
  ) {
    return this.subscriptionsService.checkSubscription(email, creatorId);
  }

  @Get('my-subscriptions')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get fan subscriptions' })
  getMySubscriptions(@Request() req) {
    return this.subscriptionsService.getFanSubscriptions(req.user.id);
  }

  @Get('all')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all subscriptions (admin)' })
  findAll() {
    return this.subscriptionsService.findAll();
  }

  @Delete(':creatorId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cancel subscription' })
  cancel(@Request() req, @Param('creatorId') creatorId: string) {
    return this.subscriptionsService.cancelSubscription(
      req.user.id,
      creatorId,
    );
  }
}
