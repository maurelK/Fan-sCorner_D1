import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Request,
  Patch,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { MessagesService } from './messages.service';
import { CreateMessageDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Messages')
@Controller('messages')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Post()
  @ApiOperation({ summary: 'Send a message' })
  create(@Request() req, @Body() createDto: CreateMessageDto) {
    return this.messagesService.create(req.user.id, createDto);
  }

  @Get('contacts')
  @ApiOperation({ summary: 'Get all contacts' })
  getContacts(@Request() req) {
    return this.messagesService.getContacts(req.user.id);
  }

  @Get('conversation/:userId')
  @ApiOperation({ summary: 'Get conversation with a user' })
  getConversation(@Request() req, @Param('userId') userId: string) {
    return this.messagesService.findConversation(req.user.id, userId);
  }

  @Patch('mark-read/:senderId')
  @ApiOperation({ summary: 'Mark messages as read' })
  markAsRead(@Request() req, @Param('senderId') senderId: string) {
    return this.messagesService.markAsRead(req.user.id, senderId);
  }
}
