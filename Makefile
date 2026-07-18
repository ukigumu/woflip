.PHONY: \
	help install dev dev-ios dev-android dev-web typecheck lint clean web-build prebuild \
	ios android ios\:devices android\:devices \
	bump-version \
	setup-secrets \
	ota-staging ota-production \
	build-android build-ios build-android-staging build-ios-staging build-all build-all-staging \
	build-android-local build-ios-local build-android-staging-local build-ios-staging-local \
	build-all-local build-all-staging-local \
	submit-android submit-ios submit-android-staging submit-ios-staging \
	submit-android-local submit-ios-local submit-android-staging-local submit-ios-staging-local \
	submit-all submit-all-local submit-all-staging \
	check-android-staging-internal-track

LOAD_ENV = set -a; [ ! -f .env ] || . ./.env; set +a;
BUMP ?= patch
MESSAGE ?= OTA update

# ─────────────────────────────────────────────────────────────
# Help
# ─────────────────────────────────────────────────────────────

help:
	@echo "Woblip · Makefile"
	@echo ""
	@echo "  Dev:"
	@echo "    make dev               expo start (Metro bundler)"
	@echo "    make dev-ios           expo start --ios"
	@echo "    make ios:devices       expo run:ios --device (interactive picker)"
	@echo "    make android           expo run:android --device (interactive picker)"
	@echo "    make android:devices   expo run:android --device (interactive picker)"
	@echo "    make dev-android       expo start --android"
	@echo "    make dev-web           expo start --web"
	@echo "    make typecheck         tsc --noEmit"
	@echo "    make lint              biome check ."
	@echo "    make clean             remove .expo / builds / dist"
	@echo "    make web-build         expo export -p web"
	@echo "    make prebuild          expo prebuild --clean"
	@echo "    make bump-version      bump package/app version patch"
	@echo "    make bump-version BUMP=minor | VERSION=1.2.3"
	@echo ""
	@echo "  EAS secrets:"
	@echo "    make setup-secrets     push .env to EAS project secrets"
	@echo ""
	@echo "  EAS OTA updates:"
	@echo "    make ota-staging MESSAGE=\"Fix login\""
	@echo "    make ota-production MESSAGE=\"Fix login\""
	@echo ""
	@echo "  EAS cloud build (production):"
	@echo "    make build-android | build-ios | build-all"
	@echo ""
	@echo "  EAS cloud build (staging):"
	@echo "    make build-android-staging | build-ios-staging | build-all-staging"
	@echo ""
	@echo "  EAS local build (production):"
	@echo "    make build-android-local | build-ios-local | build-all-local"
	@echo ""
	@echo "  EAS local build (staging):"
	@echo "    make build-{android,ios,all}-staging-local"
	@echo ""
	@echo "  Submit (cloud):"
	@echo "    make submit-{android,ios,all}        production"
	@echo "    make submit-{android,ios,all}-staging staging"
	@echo ""
	@echo "  Submit (local artifacts in ./builds):"
	@echo "    make submit-{android,ios,all}-local"
	@echo "    make submit-{android,ios}-staging-local"

# ─────────────────────────────────────────────────────────────
# Install / dev / quality
# ─────────────────────────────────────────────────────────────

install:
	pnpm install

dev:
	pnpm exec expo start

dev-ios:
	pnpm exec expo start --ios

ios:
	pnpm exec expo start --ios

# Build the native iOS app (Xcode) + install dev client + open the
# interactive device/simulator picker. Same pattern mapeat/app uses for
# `pnpm ios:simulator:device` — pick the target each run.
ios\:devices:
	pnpm exec expo run:ios --device

android:
	pnpm exec expo run:android --device

android\:devices:
	pnpm exec expo run:android --device

dev-android:
	pnpm exec expo start --android

dev-web:
	pnpm exec expo start --web

typecheck:
	pnpm exec tsc --noEmit

lint:
	pnpm exec biome check .

# Static web export → ./dist
web-build:
	pnpm exec expo export -p web

# Native prebuild (regenerates ios/ + android/). Use with care — the
# default workflow is managed (no native dirs committed).
prebuild:
	pnpm exec expo prebuild --clean

clean:
	rm -rf .expo dist builds web-build

bump-version:
	@node scripts/bump-app-version.mjs $(if $(VERSION),$(VERSION),$(BUMP))

# ─────────────────────────────────────────────────────────────
# EAS secrets — sync .env (apps/mobile/.env) to the EAS project
# ─────────────────────────────────────────────────────────────

setup-secrets:
	@grep -v '^\s*#' .env | grep -v '^\s*$$' | while IFS='=' read -r key value; do \
		eas secret:push --scope project --force --env-file /dev/stdin <<< "$$key=$$value" 2>/dev/null || \
		eas secret:create --name "$$key" --value "$$value" --scope project --force 2>/dev/null; \
	done
	@echo "Secrets synced from .env"

# ─────────────────────────────────────────────────────────────
# EAS OTA updates
# ─────────────────────────────────────────────────────────────

ota-staging:
	eas update --channel staging --environment staging --message "$(MESSAGE)"

ota-production:
	eas update --channel production --environment production --message "$(MESSAGE)"

# ─────────────────────────────────────────────────────────────
# EAS cloud builds
# ─────────────────────────────────────────────────────────────

# Build Android (production profile)
build-android:
	eas build --platform android --profile production

# Build iOS (production profile)
build-ios:
	eas build --platform ios --profile production

# Build Android (staging profile)
build-android-staging:
	eas build --platform android --profile staging

# Build iOS (staging profile)
build-ios-staging:
	eas build --platform ios --profile staging

# Build all platforms (production profile)
build-all:
	eas build --platform all --profile production

# Build all platforms (staging profile)
build-all-staging:
	eas build --platform all --profile staging

# ─────────────────────────────────────────────────────────────
# EAS local builds (artifacts → ./builds)
# ─────────────────────────────────────────────────────────────

build-android-local:
	@mkdir -p builds
	set -a && source .env && set +a && eas build --platform android --profile production --local --output builds/android-production.aab

build-ios-local:
	@mkdir -p builds
	set -a && source .env && set +a && eas build --platform ios --profile production --local --output builds/ios-production.ipa

build-android-staging-local:
	@mkdir -p builds
	set -a && source .env && set +a && eas build --platform android --profile staging --local --output builds/android-staging.aab

build-ios-staging-local:
	@mkdir -p builds
	set -a && source .env && set +a && eas build --platform ios --profile staging --local --output builds/ios-staging.ipa

build-all-local: build-android-local build-ios-local

build-all-staging-local: build-android-staging-local build-ios-staging-local

# ─────────────────────────────────────────────────────────────
# EAS submit (cloud)
# ─────────────────────────────────────────────────────────────

check-android-staging-internal-track:
	@node -e 'const track = require("./eas.json").submit?.staging?.android?.track; if (track !== "internal") { console.error("Expected eas.json submit.staging.android.track to be \"internal\" for Google Play Prueba interna, got " + JSON.stringify(track) + "."); process.exit(1); }'

# Submit Android (production)
submit-android:
	eas submit --platform android --profile production

# Submit iOS (production)
submit-ios:
	$(LOAD_ENV) eas submit --platform ios --profile production

# Submit Android (staging)
submit-android-staging: check-android-staging-internal-track
	eas submit --platform android --profile staging

# Submit iOS (staging)
submit-ios-staging:
	$(LOAD_ENV) eas submit --platform ios --profile staging

# Submit all platforms (production)
submit-all:
	eas submit --platform android --profile production
	$(LOAD_ENV) eas submit --platform ios --profile production

# Submit all platforms (staging)
submit-all-staging: check-android-staging-internal-track
	eas submit --platform android --profile staging
	$(LOAD_ENV) eas submit --platform ios --profile staging

# ─────────────────────────────────────────────────────────────
# EAS submit (local artifacts in ./builds)
# ─────────────────────────────────────────────────────────────

submit-android-local:
	eas submit --platform android --profile production --path builds/android-production.aab

submit-ios-local:
	$(LOAD_ENV) eas submit --platform ios --profile production --path builds/ios-production.ipa

submit-android-staging-local: check-android-staging-internal-track
	eas submit --platform android --profile staging --path builds/android-staging.aab

submit-ios-staging-local:
	$(LOAD_ENV) eas submit --platform ios --profile staging --path builds/ios-staging.ipa

submit-all-local:
	eas submit --platform android --profile production --path builds/android-production.aab
	$(LOAD_ENV) eas submit --platform ios --profile production --path builds/ios-production.ipa
