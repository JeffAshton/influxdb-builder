#!/usr/bin/env bash
set -eu

if [[ "${CIRCLE_TAG:-}" =~ ^v[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
	PUBLISH_VERSION=$( node ./.circleci/get-package-version.js )

elif [[ "${CIRCLE_BRANCH:-}" == "master" ]]; then

	PACKAGE_VERSION=$( node ./.circleci/get-package-version.js )
	PUBLISH_VERSION="$PACKAGE_VERSION-rc$CIRCLE_BUILD_NUM"
	npm version $PUBLISH_VERSION --no-git-tag-version --force

else
	echo "Only publishing on master and release tags"
	exit
fi

echo "//registry.npmjs.org/:_authToken=$NPM_AUTH_TOKEN" > ~/.npmrc
echo Publishing version "$PUBLISH_VERSION"
npm publish
