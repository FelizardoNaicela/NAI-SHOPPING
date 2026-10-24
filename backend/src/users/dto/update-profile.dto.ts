import {
    IsOptional,
    IsString,
    MaxLength,
    MinLength,
    Matches,
} from "class-validator";

export class UpdateProfileDto {

    @IsOptional()
    @IsString()
    @MaxLength(60)
    name?: string;

    @IsOptional()
    @IsString()
    @MinLength(3)
    @MaxLength(30)

    @Matches(/^[a-zA-Z0-9_.]+$/, {
        message:
            "O username só pode conter letras, números, _ e .",
    })

    username?: string;

    @IsOptional()
    @IsString()
    @MaxLength(20)
    phone?: string;

    @IsOptional()
    @IsString()
    @MaxLength(300)
    bio?: string;

    @IsOptional()
    @IsString()
    countryCode?: string;

    @IsOptional()
    @IsString()
    region?: string;

    @IsOptional()
@IsString()
@MaxLength(255)
avatarUrl?: string;

}