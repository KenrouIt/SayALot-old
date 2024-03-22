const { getFromIndex } = VM.require("sayalot.near/widget/lib.socialDbIndex");
const { normalize, normalizeId } = VM.require(
  "sayalot.near/widget/lib.normalization"
);

let config = {};

const currentVersion = "v0.0.3";

function normalizeOldToV_0_0_1(comment) {
  return comment;
}

function normalizeFromV0_0_1ToV0_0_2(comment) {
  return comment;
}

function normalizeFromV0_0_2ToV0_0_3(comment) {
  comment.value.comment.rootId = comment.value.comment.originalCommentId;
  delete comment.value.comment.originalCommentId;
  delete comment.value.comment.id;

  return comment;
}

function getSplittedCommentIdV0_0_3(commentId) {
  const commentIdWithoutPrefix = commentId.slice(2);
  const prefix = "c-";

  const oldFormatID = prefix + commentIdWithoutPrefix;

  const newCommentID = normalizeId(oldFormatID, "comment");

  const splitCommentId = newCommentID.split("-");

  return splitCommentId;
}

function normalizeFromV0_0_3ToV0_0_4(comment) {
  const now = Date.now();

  const splitCommentId = getSplittedCommentIdV0_0_3(
    comment.value.comment.commentId
  );
  const author = splitCommentId[1];
  comment.value.metadata = {
    id: comment.value.comment.commentId,
    author,
    createdTimestamp: now,
    lastEditTimestamp: now,
    rootId: comment.value.comment.rootId,
    versionKey: "v0.0.4",
  };

  delete comment.value.comment.commentId;
  delete comment.value.comment.rootId;

  return comment;
}

const versions = {
  old: {
    normalizationFunction: normalizeOldToV_0_0_1,
    suffixAction: "",
  },
  "v1.0.1": {
    normalizationFunction: normalizeFromV0_0_1ToV0_0_2,
    suffixAction: `-v1.0.1`,
  },
  "v0.0.2": {
    normalizationFunction: normalizeFromV0_0_2ToV0_0_3,
    suffixAction: `_v0.0.2`,
  },
  "v0.0.3": {
    normalizationFunction: normalizeFromV0_0_3ToV0_0_4,
    suffixAction: `_v0.0.3`,
  },
};

function setConfig(newConfig) {
  config = newConfig;
}

function getConfig() {
  return config;
}

function fillAction(version, config) {
  const baseAction = config.baseActions.comment;
  const filledAction = baseAction + version.suffixAction;
  return config.isTest ? `test_${filledAction}` : filledAction;
}

function getCommentBlackListByBlockHeight() {
  return [98588599];
}

function filterInvalidComments(comments) {
  return comments
    .filter(
      (comment) =>
        comment.blockHeight &&
        !getCommentBlackListByBlockHeight().includes(comment.blockHeight) // Comment is not in blacklist
    )
    .filter(
      (comment) =>
        comment.accountId ===
        getUserNameFromCommentId(comment.value.comment.commentId)
    );
}

function getUserNameFromCommentId(commentId) {
  const splittedCommentId = commentId.split("/");

  // const userNamePlusTimestamp = commentId.split("c_")[1];

  // const splittedUserNamePlusTimestamp = userNamePlusTimestamp.split("-");

  // splittedUserNamePlusTimestamp.pop();

  // const userName = splittedUserNamePlusTimestamp.join("-");

  const userName = splittedCommentId[1];

  return userName;
}

function processComments(comments) {
  const lastEditionComments = comments.filter((comment) => {
    const firstCommentWithThisCommentId = comments.find((compComment) => {
      return (
        compComment.value.comment.commentId === comment.value.comment.commentId
      );
    });

    return (
      JSON.stringify(firstCommentWithThisCommentId) === JSON.stringify(comment)
    );
  });

  const lastEditionCommentsWithoutDeletedOnes = lastEditionComments.filter(
    (comment) => !comment.value.comment.isDelete
  );

  const lastEditionCommentsWithEditionMark =
    lastEditionCommentsWithoutDeletedOnes.map((comment) => {
      const commentsWithThisCommentId = comments.filter((compComment) => {
        return (
          comment.value.comment.commentId ===
          compComment.value.comment.commentId
        );
      });

      if (commentsWithThisCommentId.length > 1) {
        comment.isEdition = true;
      }

      return comment;
    });

  return lastEditionCommentsWithEditionMark;
}

function getComments(articleId, config) {
  setConfig(config);
  const commentsByVersionPromise = Object.keys(versions).map(
    (version, index, arr) => {
      const action = fillAction(versions[version], config);

      return getFromIndex(action, articleId).then((comments) => {
        if (comments.length > 0) {
          console.log("comments: ", { action, articleId, comments });
        }
        // const validComments = filterInvalidComments(comments);

        return filterInvalidComments(
          comments.map((comment) => {
            return normalize(comment, versions, index);
          })
        );
      });
    }
  );

  return Promise.all(commentsByVersionPromise).then((commentsByVersion) => {
    return processComments(commentsByVersion.flat());
  });
}

function getAction(parameterVersion, parameterConfig) {
  //parameterVersion and parameterCconfig are optative for testing
  const baseAction =
    parameterConfig.baseActions.comment ?? getConfig().baseActions.comment;

  const versionData = parameterVersion
    ? versions[parameterVersion]
    : versions[currentVersion];

  const action = baseAction + versionData.suffixAction;

  return parameterConfig.isTest || getConfig().isTest
    ? `test_${action}`
    : action;
}

function composeCommentData(comment, version, config) {
  // if (comment.metadata.replyingTo) {
  //   //We add the following so the user been replied get's a notification
  //   comment.commentData.commentText = `@${comment.metadata.replyingTo} ${comment.commentData.commentText}`;
  // }

  let data = {
    index: {
      [getAction(version, config)]: JSON.stringify({
        key: comment.metadata.articleId,
        value: {
          type: "md",
          ...comment,
        },
      }),
    },
  };

  // TODO handle notifications properly
  // const mentions = comment.commentData.isDelete ? [] : extractMentions(comment.commentData.commentText);

  // if (mentions.length > 0) {
  //   const dataToAdd = getNotificationData(
  //     "mentionOnComment",
  //     mentions,
  //     `https://near.social/${
  //       widgets.thisForum
  //     }?sharedArticleId=${articleId}&sharedCommentId=${comment.metadata.id}${
  //       isTest ? "&isTest=t" : ""
  //     }`
  //   );

  //   data.post = dataToAdd.post;
  //   data.index.notify = dataToAdd.index.notify;
  // }

  return data;
}

function executeSaveComment(
  comment,
  onCommit,
  onCancel,
  parameterVersion,
  parameterConfig
) {
  if (!comment.metadata.isDelete && comment.commentData.commentText) {
    //parameterVersion and parameterConfig are optative for testing
    const newData = composeCommentData(
      comment,
      parameterVersion ?? currentVersion,
      parameterConfig ?? config
    );
    Social.set(newData, {
      force: true,
      onCommit,
      onCancel,
    });

    return comment.metadata.id;
  } else {
    console.error(
      "The comment should contain a text. Check: comment.commentData.commentText in lib.comment.jsx"
    );
    return;
  }
}

function createComment(props) {
  const {
    config,
    author,
    commentText,
    replyingTo,
    articleId,
    onClick,
    onCommit,
    onCancel,
  } = props;

  setConfig(config);

  onClick();

  const metadataHelper = {
    author,
    idPrefix: "comment",
    versionKey: currentVersion,
  };

  let metadata = generateMetadata(metadataHelper);
  metadata.articleId = articleId;
  metadata.replyingTo = replyingTo;

  const comment = {
    commentData: { commentText },
    metadata,
  };

  const result = executeSaveComment(comment, onCommit, onCancel);

  return { error: !result, data: result };
}

function editComment(props) {
  const { config, comment, onClick, onCommit, onCancel } = props;

  if (!comment.metadata.id) {
    console.error(
      "comment.metadata.id should be provided when editing comment"
    );
    return;
  }

  setConfig(config);

  onClick();

  let metadata = comment.metadata;

  metadata.lastEditTimestamp = Date.now();

  //===========================================================================================================================================================================
  // interface comment {
  //   commentData: {commentText: string},
  //   metadata
  // }
  //===========================================================================================================================================================================

  const newComment = {
    commentData: {commentText: comment.commentText},
    metadata,
  };

  const result = executeSaveComment(newComment, onCommit, onCancel);

  return { error: !result, data: result };
}

function deleteComment(props) {
  const { config, commentId, articleId, onClick, onCommit, onCancel } = props;

  setConfig(config);

  if (!comment.metadata.id) {
    console.error(
      "comment.metadata.id should be provided when editing comment"
    );
    return;
  }

  onClick();

  let metadata = buildDeleteMetadata(commentId);
  metadata.articleId = articleId;

  const comment = {
    metadata,
  };

  const result = executeSaveComment(comment, onCommit, onCancel);

  return { error: !result, data: result };
}

return {
  getComments,
  functionsToTest: {
    normalizeOldToV_0_0_1,
    normalizeFromV0_0_1ToV0_0_2,
    normalizeFromV0_0_2ToV0_0_3,
    normalizeFromV0_0_3ToV0_0_4,
    setConfig,
    getConfig,
    fillAction,
    getCommentBlackListByBlockHeight,
    filterInvalidComments,
    getUserNameFromCommentId,
    processComments,
    getComments,
    getSplittedCommentIdV0_0_3,
    composeCommentData,
  },
};
