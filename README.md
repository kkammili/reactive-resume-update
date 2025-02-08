Nx application:

Install it using pnpm command: pnpm install
Build all applications command: pnpm nx run-many --target=build --all --parallel=3
 
Incase prisma errors run commands below one by one:
pnpm list @prisma/client

If it's not installed, install it:
pnpm add @prisma/client
Run the following command to regenerate the Prisma client:
pnpm prisma 
pnpm nx serve server


