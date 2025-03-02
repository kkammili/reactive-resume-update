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
import {
  addingMissingSkills,
  addResumePointsToExperience,
  extractJobDescSkills,
  generateProfessionalSummary,
  generateResumePoints,
} from "./utils";

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
    try {
      const { data: resumeData, jobDesc, tempType } = updateResumeDto;
      // await new Promise((resolve) => setTimeout(resolve, 30_000));

      // Step 1: Parse Resume Data and Job Description working
      const requiredSkills = await extractJobDescSkills(jobDesc);

      const resumeSkills = resumeData.data.sections.skills.items.map((skill) => skill.name);

      // Step 2: Identify Missing Skills
      // consider finding and adding resume point keywords to resume skills
      const missingSkills = requiredSkills.jobDescTechSkills.filter((jobSkill: string) => {
        // Check if the job skill is not directly present in the resume skills
        if (!resumeSkills.includes(jobSkill)) {
          // Check if any resume skill starts with the job skill (e.g., "HTML5" starts with "HTML")
          const hasNewerVersion = resumeSkills.some((resumeSkill) =>
            resumeSkill.startsWith(jobSkill),
          );
          // Include the job skill in missing skills only if no newer version exists in the resume
          return !hasNewerVersion;
        }
        return false; // Skill is present in the resume, so it's not missing
      });

      // Step 3: Using AI (in parallel) to generate everything
      const [newSkills, newResumePoints, newProfessionalSummary] = await Promise.all([
        addingMissingSkills(resumeData.data.sections.skills.items, missingSkills),
        generateResumePoints(missingSkills),
        generateProfessionalSummary(
          resumeData.data.sections.summary.content,
          jobDesc,
          requiredSkills.companyName,
        ),
      ]);

      // Step 4: Updating JSON Resume
      // adding new summary
      resumeData.data.sections.summary.content = newProfessionalSummary;

      // adding newSkills
      resumeData.data.sections.skills.items = newSkills.items;

      // adding new resume points
      const newExp = addResumePointsToExperience(
        newResumePoints,
        resumeData.data.sections.experience,
      );

      resumeData.data.sections.experience = newExp;

      // adding missing skills
      resumeData.missingSkills = missingSkills;

      // updating template
      resumeData.data.metadata.template = tempType;

      // Step 5: Return Updated JSON
      return resumeData;
    } catch (error) {
      // console.error("Error processing request:", error);
      throw new Error(error.message);
      // res.status(500).json({ message: 'Internal server error', error: error.message });
    }
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
