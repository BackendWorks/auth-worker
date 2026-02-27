import { Module } from '@nestjs/common';

import { CommonModule } from 'src/common/common.module';
import { EmailModule } from 'src/modules/email/email.module';

@Module({
    imports: [CommonModule, EmailModule],
})
export class AppModule {}
