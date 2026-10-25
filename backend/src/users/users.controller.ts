import {
    Controller,
    Get,
    Patch,
    Delete,
    Body,
    Req,
    UseGuards,
    UseInterceptors,
    UploadedFile,
    Post,
    Param
} from "@nestjs/common";
import { UsersService } from "./users.service";
import { JwtAuthGuard } from "../auth/jwt/jwt-auth.guard";
import { UpdateProfileDto } from "./dto/update-profile.dto";
import { ChangeEmailDto } from "./dto/change-email.dto";
import { ChangePasswordDto } from "./dto/change-password.dto";
import { FileInterceptor } from "@nestjs/platform-express";
import { diskStorage } from "multer";
import { extname } from "path";
import { UPLOADS_DIR } from '../common/storage-paths';
import * as path from 'path';

@Controller("users")
export class UsersController {

    constructor(

        private readonly usersService: UsersService,

    ) {}

    /*
    =====================================================
    MEU PERFIL
    =====================================================
    */
@UseGuards(JwtAuthGuard)
    @Get("me")
    async getProfile(
        @Req() req: any,
    ) {

        return this.usersService.getProfile(
            req.user.sub,
        );

    }

@Get(":username")
async getPublicProfile(

    @Param("username")
    username: string,

) {

    return this.usersService.getPublicProfile(
        username,
    );

}

    /*
    =====================================================
    ATUALIZAR PERFIL
    =====================================================
    */
@UseGuards(JwtAuthGuard)
    @Patch("me")
    async updateProfile(

        @Req() req: any,

        @Body() body: UpdateProfileDto,
    ) {

        return this.usersService.updateProfile(

            req.user.sub,

            body,

        );

    }
@UseGuards(JwtAuthGuard)
    @Post("me/avatar")
@UseInterceptors(

    FileInterceptor(

        "file",

        {

            storage: diskStorage({

                destination: (_req, _file, cb) => {
    cb(null, path.join(UPLOADS_DIR, 'users'));
},

                filename: (

                    req,

                    file,

                    callback,

                ) => {

                    const uniqueName =
                        Date.now() +
                        "-" +
                        Math.round(
                            Math.random() * 1e9,
                        ) +
                        extname(
                            file.originalname,
                        );

                    callback(
                        null,
                        uniqueName,
                    );

                },

            }),

        },

    ),

)
@UseGuards(JwtAuthGuard)
async uploadAvatar(

    @Req() req: any,

    @UploadedFile()
    file: Express.Multer.File,

) {

    return this.usersService.updateAvatar(

    req.user.sub,

    `/uploads/users/${file.filename}`,

);

}

    /*
    =====================================================
    ALTERAR EMAIL
    =====================================================
    */
@UseGuards(JwtAuthGuard)
    @Patch("me/email")
    async changeEmail(

        @Req() req: any,

        @Body() body: ChangeEmailDto,

    ) {

        return this.usersService.changeEmail(

    req.user.sub,

    body,

);

    }

    /*
    =====================================================
    ALTERAR PASSWORD
    =====================================================
    */
@UseGuards(JwtAuthGuard)
    @Patch("me/password")
    async changePassword(

        @Req() req: any,

        @Body() body: ChangePasswordDto,

    ) {

        return this.usersService.changePassword(

    req.user.sub,

    body,

);

    }

    /*
    =====================================================
    ELIMINAR CONTA
    =====================================================
    */
@UseGuards(JwtAuthGuard)
    @Delete("me")
    async deleteAccount(

        @Req() req: any,

        @Body() body: {

            password: string;

        },

    ) {

        return this.usersService.deleteAccount(

            req.user.sub,

            body.password,

        );

    }

}