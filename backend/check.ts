import 'dotenv/config';
import { PrismaClient } from "@prisma/client";
const p = new PrismaClient();
p.event.findFirst({include: {timeline_items: true}}).then(e => console.log(JSON.stringify(e, null, 2))).finally(() => p.$disconnect());
