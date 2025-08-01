import { ApiProperty } from '@nestjs/swagger';

export class FileUploadResponseDto {
  @ApiProperty({ description: 'Generated filename' })
  filename: string;

  @ApiProperty({ description: 'Original filename' })
  originalName: string;

  @ApiProperty({ description: 'File size in bytes' })
  size: number;

  @ApiProperty({ description: 'File MIME type' })
  mimetype: string;

  @ApiProperty({ description: 'File access URL' })
  url: string;
}

export class MultipleFileUploadResponseDto {
  @ApiProperty({ type: [FileUploadResponseDto], description: 'Uploaded files information' })
  files: FileUploadResponseDto[];

  @ApiProperty({ description: 'Number of uploaded files' })
  count: number;
}
