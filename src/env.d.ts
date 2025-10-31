/// <reference path="../.astro/types.d.ts" />

declare namespace NodeJS {
	interface ProcessEnv {
		SOURCE_BUCKET_NAME?: string;
		DEST_BUCKET_NAME?: string;
		JSON_FILE_PATH?: string; // already used in build tests
	}
}