import { IsNotEmpty, IsString, IsInt, IsEmail, IsUUID, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreatePaymentRequestDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  @IsNotEmpty()
  @IsUUID()
  creatorId: string;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000', required: false })
  @IsOptional()
  @IsUUID()
  fanId?: string;

  @ApiProperty({ example: 'John Doe' })
  @IsNotEmpty()
  @IsString()
  userName: string;

  @ApiProperty({ example: 'john@example.com' })
  @IsNotEmpty()
  @IsEmail()
  userEmail: string;

  @ApiProperty({ example: '+22997123456' })
  @IsNotEmpty()
  @IsString()
  userPhone: string;

  @ApiProperty({ example: 1000 })
  @IsNotEmpty()
  @IsInt()
  amount: number;

  @ApiProperty({ example: 'kkiapay' })
  @IsNotEmpty()
  @IsString()
  paymentProvider: string;
}

export class VerifyPaymentDto {
  @ApiProperty({ example: 'txn_123456789' })
  @IsNotEmpty()
  @IsString()
  transactionId: string;
}
