import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PostsService } from './posts.service';
import { CreatePostDto, UpdatePostDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Posts')
@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new post (creators only)' })
  create(@Request() req, @Body() createPostDto: CreatePostDto) {
    return this.postsService.create(req.user.id, createPostDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all posts' })
  findAll() {
    return this.postsService.findAll();
  }

  @Get('my-posts')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current creator posts' })
  getMyPosts(@Request() req) {
    return this.postsService.getCreatorPosts(req.user.id);
  }

  @Get('subscribed')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get posts from subscribed creators' })
  getSubscribedPosts(@Request() req) {
    return this.postsService.getSubscribedPosts(req.user.id);
  }

  @Get('creator/:creatorId')
  @ApiOperation({ summary: 'Get posts by creator' })
  findByCreator(@Param('creatorId') creatorId: string) {
    return this.postsService.findByCreator(creatorId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific post' })
  findOne(@Param('id') id: string) {
    return this.postsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a post' })
  update(
    @Param('id') id: string,
    @Request() req,
    @Body() updatePostDto: UpdatePostDto,
  ) {
    return this.postsService.update(id, req.user.id, updatePostDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a post' })
  remove(@Param('id') id: string, @Request() req) {
    return this.postsService.remove(id, req.user.id);
  }
}
