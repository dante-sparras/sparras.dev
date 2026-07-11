import { createSectionPage } from "@/lib/i18n";

const section = createSectionPage("resume");

export const generateMetadata = section.generateMetadata;
export default section.Page;
