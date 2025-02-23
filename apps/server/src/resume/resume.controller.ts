import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  InternalServerErrorException,
  Logger,
  Param,
  Patch,
  Post,
  UseGuards,
} from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { User as UserEntity } from "@prisma/client";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";
import {
  CreateResumeDto,
  importResumeSchema,
  ResumeDto,
  UpdateResumeDto,
} from "@reactive-resume/dto";
import { resumeDataSchema } from "@reactive-resume/schema";
import { ErrorMessage } from "@reactive-resume/utils";
import { zodToJsonSchema } from "zod-to-json-schema";

import { User } from "@/server/user/decorators/user.decorator";

import { OptionalGuard } from "../auth/guards/optional.guard";
import { TwoFactorGuard } from "../auth/guards/two-factor.guard";
import { Resume } from "./decorators/resume.decorator";
import { ResumeGuard } from "./guards/resume.guard";
import { ResumeService } from "./resume.service";

@ApiTags("Resume")
@Controller("resume")
export class ResumeController {
  constructor(private readonly resumeService: ResumeService) {}

  @Get("schema")
  getSchema() {
    return zodToJsonSchema(resumeDataSchema);
  }

  @Post()
  @UseGuards(TwoFactorGuard)
  async create(@User() user: UserEntity, @Body() createResumeDto: CreateResumeDto) {
    try {
      return await this.resumeService.create(user.id, createResumeDto);
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError && error.code === "P2002") {
        throw new BadRequestException(ErrorMessage.ResumeSlugAlreadyExists);
      }

      Logger.error(error);
      throw new InternalServerErrorException(error);
    }
  }

  @Post("import")
  @UseGuards(TwoFactorGuard)
  async import(@User() user: UserEntity, @Body() importResumeDto: unknown) {
    try {
      const result = importResumeSchema.parse(importResumeDto);
      return await this.resumeService.import(user.id, result);
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError && error.code === "P2002") {
        throw new BadRequestException(ErrorMessage.ResumeSlugAlreadyExists);
      }

      Logger.error(error);
      throw new InternalServerErrorException(error);
    }
  }

  @Post("updateResume")
  @UseGuards(TwoFactorGuard)
  async updateResume(
    @Body() updateResumeDto: { data: ResumeDto; jobDesc: string; tempType: string },
  ) {
    const { data: resumeData, jobDesc, tempType } = updateResumeDto;
    // await new Promise((resolve) => setTimeout(resolve, 30_000));

    // Step 1: Parse Resume Data and Job Description working
    // const requiredSkills = extractJobDescSkills(jobDesc);

    const requiredSkills = {
      company_name: "JPMorgan Chase",
      company_details:
        "As a Lead Software Engineer at JPMorgan Chase within the Corporate Technology, you are an integral part of an agile team that works to enhance, build, and deliver trusted market-leading technology products in a secure, stable, and scalable way.",
      job_desc_tech_skills: [
        "data structures",
        "algorithms",
        "software design",
        "responsive design",
        "JavaScript frameworks",
        "React",
        "Angular",
        "Ember",
        "Node.js",
        "AJAX",
        "HTML5",
        "CSS3",
        "TypeScript",
        "object-oriented JavaScript",
        "design patterns",
        "continuous integration",
        "deployment architecture",
        "Webpack",
        "Superagent",
        "Babel",
        "Web Vitals",
        "Redux Toolkit",
        "Atomic CSS",
        "Storybook",
        "JSON",
        "REST APIs",
        "Web application CI/CD",
        "web application performance",
        "debugging",
      ],
    };

    return requiredSkills;

    // const resumeSkills = resumeData.data.sections.skills.items.map((skill) => skill.name);

    // Step 2: Identify Missing Skills
    //   const missingSkills = requiredSkills.filter(skill => !resumeSkills.includes(skill));

    //   // Step 3: Generate New Resume Points Using AI (in parallel)
    //   const newResumePoints = await Promise.all(
    //     missingSkills.map(skill => generateResumePoint(skill))
    //   );

    //   // Step 4: Update the Resume JSON
    //   const updatedResumeData = addResumePoints(resumeData, newResumePoints);

    //   // Step 5: Return Updated JSON
    //   res.status(200).json(updatedResumeData);
    // } catch (error) {
    //   console.error('Error processing request:', error);
    //   res.status(500).json({ message: 'Internal server error', error: error.message });
    // }
  }

  @Get()
  @UseGuards(TwoFactorGuard)
  findAll(@User() user: UserEntity) {
    return this.resumeService.findAll(user.id);
  }

  @Get(":id")
  @UseGuards(TwoFactorGuard, ResumeGuard)
  findOne(@Resume() resume: ResumeDto) {
    return resume;
  }

  @Get(":id/statistics")
  @UseGuards(TwoFactorGuard)
  findOneStatistics(@Param("id") id: string) {
    return this.resumeService.findOneStatistics(id);
  }

  @Get("/public/:username/:slug")
  @UseGuards(OptionalGuard)
  findOneByUsernameSlug(
    @Param("username") username: string,
    @Param("slug") slug: string,
    @User("id") userId: string,
  ) {
    return this.resumeService.findOneByUsernameSlug(username, slug, userId);
  }

  @Patch(":id")
  @UseGuards(TwoFactorGuard)
  update(
    @User() user: UserEntity,
    @Param("id") id: string,
    @Body() updateResumeDto: UpdateResumeDto,
  ) {
    return this.resumeService.update(user.id, id, updateResumeDto);
  }

  @Patch(":id/lock")
  @UseGuards(TwoFactorGuard)
  lock(@User() user: UserEntity, @Param("id") id: string, @Body("set") set = true) {
    return this.resumeService.lock(user.id, id, set);
  }

  @Delete(":id")
  @UseGuards(TwoFactorGuard)
  remove(@User() user: UserEntity, @Param("id") id: string) {
    return this.resumeService.remove(user.id, id);
  }

  @Get("/print/:id")
  @UseGuards(OptionalGuard, ResumeGuard)
  async printResume(@User("id") userId: string | undefined, @Resume() resume: ResumeDto) {
    try {
      const url = await this.resumeService.printResume(resume, userId);

      return { url };
    } catch (error) {
      Logger.error(error);
      throw new InternalServerErrorException(error);
    }
  }

  @Get("/print/:id/preview")
  @UseGuards(TwoFactorGuard, ResumeGuard)
  async printPreview(@Resume() resume: ResumeDto) {
    try {
      const url = await this.resumeService.printPreview(resume);

      return { url };
    } catch (error) {
      Logger.error(error);
      throw new InternalServerErrorException(error);
    }
  }
}
