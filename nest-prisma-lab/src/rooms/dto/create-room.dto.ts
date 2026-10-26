import { IsString, IsNotEmpty, IsOptional, IsBoolean, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateRoomDto {
    // name
    @ApiProperty({
        description: 'Room name',
        example: 'Deluxe Room',
    })
    @IsString()
    @IsNotEmpty()
    @MaxLength(100, { 
        message: 'Name must be at most 100 characters long' 
    })
    name!: string;

    // description
    @ApiProperty({
        description: 'Room description',
        example: 'A spacious room with a king-size bed and a beautiful view.',
        required: false,
    })
    @IsString()
    @IsOptional()
    description!: string;

    // capacity
    @ApiProperty({
        description: 'Room capacity',
        example: 2,
    })
    @IsNotEmpty()
    capacity!: number;

    // price_per_night
    @ApiProperty({
        description: 'Price per night for the room',
        example: 150.00,
    })
    @IsNotEmpty()
    price_per_night!: number;

    // image_url
    @ApiProperty({
        description: 'URL of the room image',
        example: 'https://example.com/images/deluxe-room.jpg',
        required: false,
    })
    @IsString()
    @IsOptional()
    image_url!: string;

    // is_active
    @ApiProperty({
        description: 'Indicates whether the room is active or not',
        example: true,
        required: false,
    })
    @IsOptional()
    @IsBoolean()
    is_active?: boolean;
}
