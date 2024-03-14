const { getFromIndex } = VM.require("sayalot.near/widget/lib.socialDbIndex");
const { generateMetadata, updateMetadata, buildDeleteMetadata } = VM.require(
  "sayalot.near/widget/lib.metadata"
);

const currentVersion = "v0.0.3";

let config = {};

function setConfig(value) {
  config = value;
}

function getConfig() {
  return config;
}

function normalizeOldToV_0_0_1(upVote) {
  return upVote;
}

function normalizeFromV0_0_1ToV0_0_2(upVote) {
  upVote.sbts = ["public"];
  return upVote;
}

function normalizeFromV0_0_2ToV0_0_3(upVote) {
  return upVote;
}

const versions = {
  old: {
    normalizationFunction: normalizeOldToV_0_0_1,
    suffixAction: "",
  },
  "v0.0.1": {
    normalizationFunction: normalizeFromV0_0_1ToV0_0_2,
    suffixAction: `-v0.0.1`,
  },
  "v0.0.2": {
    normalizationFunction: normalizeFromV0_0_2ToV0_0_3,
    suffixAction: `_v0.0.2`,
  },
};

function getUpVotesData(action, id) {
  return getFromIndex(action, id);
}

function fillAction(version, isTest) {
  const baseAction = getConfig().baseActions.upVote;
  const filledAction = baseAction + version.suffixAction;
  return isTest ? `test_${filledAction}` : filledAction;
}

function getUpVoteBlackListByBlockHeight() {
  return [];
}

function getLatestEdits(upVotes) {
  return upVotes.filter((obj) => {
    const userLatestInteraction = upVotes.find(
      (vote) => vote.accountId === obj.accountId
    );
    return JSON.stringify(userLatestInteraction) === JSON.stringify(obj);
  });
}

function filterInvalidUpVotes(upVotes) {
  console.log("getUpVoteBlackListByBlockHeight", getUpVoteBlackListByBlockHeight())
  return upVotes
    .filter((upVote) => upVote.value.upVoteId) // Has id
    .filter(
      (upVote) =>
        !getUpVoteBlackListByBlockHeight().includes(upVote.blockHeight) // Blockheight is not in blacklist
    );
}

function normalizeUpVote(upVote, versionsIndex) {
  const versionsKeys = Object.keys(versions);
  for (let i = versionsIndex; i < versionsKeys.length; i++) {
    const version = versions[versionsKeys[i]];
    upVote = version.normalizationFunction(upVote);
  }
  return upVote;
}

function getUpVotes(articleId, config) {
  setConfig(config);
  const upVotesByVersionPromise = Object.keys(versions).map(
    (version, versionIndex, arr) => {
      const action = fillAction(versions[version]);

      return getUpVotesData(action, articleId).then((upVotes) => {
        const validUpVotes = filterInvalidUpVotes(upVotes);
        const latestUpVotes = getLatestEdits(validUpVotes);

        const nonDeletedVotes = latestUpVotes.filter((vote) => {
          return !vote.value.isDelete;
        });

        const normalizedVotes = nonDeletedVotes.map((upVote) =>
          normalizeUpVote(upVote, versionIndex)
        );

        return normalizedVotes;
      });
    }
  );
  return Promise.all(upVotesByVersionPromise).then((upVotesByVersion) => {
    return upVotesByVersion.flat();
  });
}

function getAction(version, config) {//version and config are optative for testing
  const baseAction =
    config.baseActions.upVote ?? getConfig().baseActions.upVote;
  const versionData = version ? versions[version] : versions[currentVersion];
  const action = baseAction + versionData.suffixAction;
  return config.isTest || getConfig().isTest ? `test_${action}` : action;
}


function composeData(articleId, upVote, version, config) { //version and config are optative for testing
  let data = {
    index: {
      [getAction(version, config)]: JSON.stringify({
        key: articleId,
        value: {
          ...upVote,
        },
      }),
    },
  };

  // TODO handle notifications properly
  // const mentions = extractMentions(article.body);

  // if (mentions.length > 0) {
  //   const dataToAdd = getNotificationData(
  //     "mention",
  //     mentions,
  //     `https://near.social/${widgets.thisForum}?sharedArticleId=${article.id}${
  //       isTest ? "&isTest=t" : ""
  //     }`
  //   );

  //   data.post = dataToAdd.post;
  //   data.index.notify = dataToAdd.index.notify;
  // }

  return data;
}

function executeSaveUpVote(articleId, upVote, onCommit, onCancel, version, config) {//version and config are optative for testing
  const newData = composeData(articleId, upVote, version, config);
  Social.set(newData, {
    force: true,
    onCommit,
    onCancel,
  });

  return upVote.upVoteData.upVoteId;
}

function createUpVote(
  config,
  articleId,
  upVoteData,
  userMetadataHelper,
  onCommit,
  onCancel
) {
  // interface upVoteData {
  //   isDelete: boolean,
  //   sbts: [sbt], //For the moment should only have 1 sbt in the array
  // }
  setConfig(config);

  const metadataHelper = {
    ...userMetadataHelper,
    idPrefix: "uv",
    versionKey: currentVersion,
  };
  const metadata = generateMetadata(metadataHelper);
  const upVote = {
    upVoteData: upVoteData,
    metadata,
  };
  const result = executeSaveUpVote(articleId, upVote, onCommit, onCancel);
  return { error: false, data: result };
}

return {
  getUpVotes,
  functionsToTest: {
    normalizeOldToV_0_0_1,
    normalizeFromV0_0_1ToV0_0_2,
    normalizeFromV0_0_2ToV0_0_3,
    getUpVotesData,
    fillAction,
    getUpVoteBlackListByBlockHeight,
    getLatestEdits,
    filterInvalidUpVotes,
    normalizeUpVote,
    composeData,
    executeSaveUpVote,
    createUpVote,
  },
};
