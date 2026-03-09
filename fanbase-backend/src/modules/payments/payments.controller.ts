import { Controller, Get, Post, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { CreatePaymentRequestDto, VerifyPaymentDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Payments')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('request')
  @ApiOperation({ summary: 'Create payment request' })
  createPaymentRequest(@Body() createDto: CreatePaymentRequestDto) {
    return this.paymentsService.createPaymentRequest(createDto);
  }

  @Post('verify')
  @ApiOperation({ summary: 'Verify payment' })
  verifyPayment(@Body() verifyDto: VerifyPaymentDto) {
    return this.paymentsService.verifyPayment(verifyDto);
  }

  @Get('requests')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get payment requests' })
  getPaymentRequests(@Request() req) {
    return this.paymentsService.getPaymentRequests(req.user.id);
  }

  @Post('confirm/:requestId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Confirm payment (admin only)' })
  confirmPayment(@Param('requestId') requestId: string, @Request() req) {
    return this.paymentsService.confirmPayment(requestId, req.user.id);
  }
}
