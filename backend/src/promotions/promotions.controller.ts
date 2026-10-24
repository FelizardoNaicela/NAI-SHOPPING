import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
  Delete,
} from "@nestjs/common";

import { PromotionsService } from "./promotions.service";

import { JwtAuthGuard } from "../auth/jwt/jwt-auth.guard";

import type { Request } from "express";

@Controller("promotions")
export class PromotionsController {
  constructor(
    private readonly promotionsService: PromotionsService,
  ) {}

  // =========================================================
  // MINHAS CAMPANHAS
  // =========================================================

  @UseGuards(JwtAuthGuard)
  @Get("mine")
  async mine(
    @Req() req: Request,
  ) {
    const userId =
      this.getUserId(req);

    return this.promotionsService.findMyPromotions(
      userId,
    );
  }

  // =========================================================
  // CRIAR
  // =========================================================

  @UseGuards(JwtAuthGuard)
  @Post()
  async create(
    @Req() req: Request,
    @Body() body: any,
  ) {

    const userId =
      this.getUserId(req);

    return this.promotionsService.create(
      userId,
      body,
    );
  }

  // =========================================================
  // FEED
  // =========================================================

  @Get("public/feed")
  async feed(
    @Query("start") start?: string,
    @Query("limit") limit?: string,
    @Query("seed") seed?: string,
  ) {
    const parsedStart =
      Number(start ?? 0);

    const parsedLimit =
      Number(limit ?? 10);

    return this.promotionsService.getFeedPromotions({
      start:
        Number.isFinite(parsedStart)
          ? parsedStart
          : 0,

      limit:
        Number.isFinite(parsedLimit) &&
        parsedLimit > 0
          ? parsedLimit
          : 10,

      seed:
        seed ?? "default",
    });
  }

  // =========================================================
  // PESQUISA
  // =========================================================

  @Get("public/search")
  async search(
    @Query("seed") seed?: string,
  ) {
    return this.promotionsService.getSearchPromotions(
      seed ?? "default",
    );
  }

  // =========================================================
  // CATEGORIA
  // =========================================================

  @Get("public/category")
  async category(
    @Query("seed") seed?: string,
  ) {
    return this.promotionsService.getCategoryPromotions(
      seed ?? "default",
    );
  }

  // =========================================================
  // PACOTES
  // =========================================================

  @UseGuards(JwtAuthGuard)
  @Get("packages")
  async packages() {
    return this.promotionsService.getPackages();
  }

  // =========================================================
  // ALTERAR PACOTE
  // =========================================================

  @UseGuards(JwtAuthGuard)
  @Post(":id/change-package")
  async changePackage(
    @Req() req: Request,
    @Param("id") id: string,
    @Body()
    body: {
      packageId: string;
    },
  ) {
    const userId =
      this.getUserId(req);

    return this.promotionsService.changePackage(
      userId,
      id,
      body.packageId,
    );
  }

  // =========================================================
  // CRIAR INTENÇÃO DE PAGAMENTO
  // =========================================================
  //
  // Cria um SitePayment com status PENDING.
  //
  // NÃO confirma o pagamento.
  //
  // =========================================================

  @UseGuards(JwtAuthGuard)
  @Post(":id/payment")
  async createPromotionPayment(
    @Req() req: Request,
    @Param("id") id: string,
  ) {
    const userId =
      this.getUserId(req);

    return this.promotionsService.createPromotionPayment(
      userId,
      id,
    );
  }

  // =========================================================
  // CONSULTAR PAGAMENTOS DA CAMPANHA
  // =========================================================

  @UseGuards(JwtAuthGuard)
  @Get(":id/payment")
  async getPromotionPayment(
    @Req() req: Request,
    @Param("id") id: string,
  ) {
    const userId =
      this.getUserId(req);

    return this.promotionsService.getPromotionPayment(
      userId,
      id,
    );
  }

  // =========================================================
  // ELIMINAR UMA CAMPANHA DO HISTÓRICO
  // =========================================================

  @UseGuards(JwtAuthGuard)
  @Delete(":id/history")
  async deleteHistoryItem(
    @Req() req: Request,
    @Param("id") id: string,
  ) {
    const userId =
      this.getUserId(req);

    return this.promotionsService.deleteHistoryItem(
      userId,
      id,
    );
  }

  // =========================================================
  // ELIMINAR TODO O HISTÓRICO
  // =========================================================

  @UseGuards(JwtAuthGuard)
  @Delete("history/all")
  async deleteAllHistory(
    @Req() req: Request,
  ) {
    const userId =
      this.getUserId(req);

    return this.promotionsService.deleteAllHistory(
      userId,
    );
  }

  // =========================================================
  // BUSCAR UMA CAMPANHA
  // =========================================================

  @UseGuards(JwtAuthGuard)
  @Get(":id")
  async findOne(
    @Req() req: Request,
    @Param("id") id: string,
  ) {
    const userId =
      this.getUserId(req);

    return this.promotionsService.findOne(
      userId,
      id,
    );
  }

  // =========================================================
  // ATUALIZAR
  // =========================================================

  @UseGuards(JwtAuthGuard)
  @Patch(":id")
  async update(
    @Req() req: Request,
    @Param("id") id: string,
    @Body() body: any,
  ) {
    const userId =
      this.getUserId(req);

    return this.promotionsService.update(
      userId,
      id,
      body,
    );
  }

  // =========================================================
  // ATIVAR
  // =========================================================

  @UseGuards(JwtAuthGuard)
  @Post(":id/activate")
  async activate(
    @Req() req: Request,
    @Param("id") id: string,
  ) {
    const userId =
      this.getUserId(req);

    return this.promotionsService.activate(
      userId,
      id,
    );
  }

  // =========================================================
  // PAUSAR
  // =========================================================

  @UseGuards(JwtAuthGuard)
  @Post(":id/pause")
  async pause(
    @Req() req: Request,
    @Param("id") id: string,
  ) {
    const userId =
      this.getUserId(req);

    return this.promotionsService.pause(
      userId,
      id,
    );
  }

  // =========================================================
  // CANCELAR
  // =========================================================

  @UseGuards(JwtAuthGuard)
  @Post(":id/cancel")
  async cancel(
    @Req() req: Request,
    @Param("id") id: string,
  ) {
    const userId =
      this.getUserId(req);

    return this.promotionsService.cancel(
      userId,
      id,
    );
  }

  // =========================================================
  // IMPRESSÃO
  // =========================================================

  @Post(":id/impression")
  async impression(
    @Param("id") id: string,
  ) {
    return this.promotionsService.registerImpression(
      id,
    );
  }

  // =========================================================
  // USER ID
  // =========================================================

  private getUserId(
    req: Request,
  ): string {
    const user =
      (req as any).user;

    if (!user?.sub) {
      throw new Error(
        "Usuário autenticado não encontrado.",
      );
    }

    return user.sub;
  }
}