import { createSectionPage } from "@/lib/i18n";

const section = createSectionPage("about");

export const generateMetadata = section.generateMetadata;
export default section.Page;
