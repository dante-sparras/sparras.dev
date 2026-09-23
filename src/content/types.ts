import type Image from "next/image";
import type Link from "next/link";
import type { ComponentProps } from "react";

export type Href = ComponentProps<typeof Link>["href"];

export type ImageSrc = ComponentProps<typeof Image>["src"];
