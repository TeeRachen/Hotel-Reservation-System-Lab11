/*
AI Declaration:
I used ChatGPT to help with guiding on how to implement the roles decorator and debugging the role-based access control logic.
I also used ChatGPT to create test cases guide.

Reflection:
The guidance provided by ChatGPT helped me understand the usage of enums for defining roles.
I learned how to implement role-based access control in a NestJS application using decorators.
I also learned how to modify the roles enum and user class to support multiple roles for a user.
*/

import { SetMetadata } from '@nestjs/common';
import { Role } from '../roles/roles.enum';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);