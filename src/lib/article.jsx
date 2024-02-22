// lib.article

const {
  mainStateUpdate,
  isTest,
  stateUpdate,
  functionsToCallByLibrary,
  callLibs,
  baseAction,
  kanbanColumns,
  widgets,
  usersSBTs,
} = props;

const libName = "article"; // EDIT: set lib name
const functionsToCall = functionsToCallByLibrary[libName];

let resultFunctionsToCallByLibrary = Object.assign(
  {},
  functionsToCallByLibrary
);
let resultFunctionsToCall = [];

const currentVersion = "0.0.2"; // EDIT: Set version

const prodAction = `${baseAction}_v${currentVersion}`;
const testAction = `test_${prodAction}`;
const versionsBaseActions = isTest ? `test_${baseAction}` : baseAction;
const action = isTest ? testAction : prodAction;
// START LIB CALLS SECTION
// interface FunctionCall {
//     functionName: string,
//     key: string, // The state of the caller will be updated with this string as a key
//     props: Record<string, any> // function parameters as object
// }

// type LibsCalls = Record<string, FunctionCall> // Key is lib name after lib.

const libSrcArray = [widgets.libs.libSBT, widgets.libs.libUpVotes]; // string to lib widget // EDIT: set libs to call

const imports = { notifications: ["getNotificationData"] };

const libCalls = {};
libSrcArray.forEach((libSrc) => {
  const libName = libSrc.split("lib.")[1];
  libCalls[libName] = [];
});

State.init({
  libCalls, // is a LibsCalls object
  notifications: {},
});
// END LIB CALLS SECTION

function log(message) {
  console.log(`lib.${libName}`, message);
}

function logError(message) {
  console.error(`lib.${libName}`, message);
}

function libStateUpdate(obj) {
  State.update(obj);
}

// START LIB FUNCTIONS: EDIT set functions you need
function canUserCreateArticle(props) {
  const { env, accountId, sbtsNames } = props;

  if (accountId) {
    setAreValidUsers([accountId], sbtsNames);
  } else {
    return false;
  }

  const result = state[`isValidUser-${accountId}`];
  resultFunctionsToCall = resultFunctionsToCall.filter((call) => {
    const discardCondition =
      call.functionName === "canUserCreateArticle" && result !== undefined;
    return !discardCondition;
  });

  return result;
}

function setAreValidUsers(accountIds, sbtsNames) {
  const newLibsCalls = Object.assign({}, state.libCalls);
  if (!newLibsCalls.SBT) {
    logError("Key SBT is not set in lib.", libName);
  }

  accountIds.forEach((accountId) => {
    const isCallPushed =
      newLibsCalls.SBT.find((libCall) => {
        return (
          libCall.functionName === "isValidUser" &&
          libCall.props.accountId === accountId
        );
      }) !== undefined;
    const isCallReturned = state[`isValidUser-${accountId}`] !== undefined;

    if (isCallPushed || isCallReturned) {
      return;
    }

    const existingUserSBTs = usersSBTs.find(
      (userSBTs) => userSBTs.user === accountId
    );

    if (!existingUserSBTs) {
      newLibsCalls.SBT.push({
        functionName: "isValidUser",
        key: `isValidUser-${accountId}`,
        props: {
          accountId,
          sbtsNames,
        },
      });
    }
  });
  State.update({ libCalls: newLibsCalls });
}

function createArticle(props) {
  const { article, onCommit, onCancel } = props;

  saveHandler(article, onCommit, onCancel);

  resultFunctionsToCall = resultFunctionsToCall.filter((call) => {
    return call.functionName !== "createArticle";
  });

  return article;
}

function deleteArticle(props) {
  const { article, onCommit, onCancel } = props;

  article.deletedArticle = true;

  saveHandler(article, onCommit, onCancel);

  resultFunctionsToCall = resultFunctionsToCall.filter((call) => {
    return call.functionName !== "deleteArticle";
  });

  return article;
}

const saveHandler = (article, onCommit, onCancel) => {
  if (article.title && article.body) {
    const newData = composeData(article);

    Social.set(newData, {
      force: true,
      onCommit,
      onCancel,
    });
  } else {
    logError("Article is missing title or body");
  }
};

function getNotificationData(type, accountId, url) {
  if (state.notifications.getNotificationData) {
    return state.notifications.getNotificationData(type, accountId, url);
  }
}

function extractMentions(text) {
  const mentionRegex =
    /@((?:(?:[a-z\d]+[-_])*[a-z\d]+\.)*(?:[a-z\d]+[-_])*[a-z\d]+)/gi;
  mentionRegex.lastIndex = 0;
  const accountIds = new Set();
  for (const match of text.matchAll(mentionRegex)) {
    if (
      !/[\w`]/.test(match.input.charAt(match.index - 1)) &&
      !/[/\w`]/.test(match.input.charAt(match.index + match[0].length)) &&
      match[1].length >= 2 &&
      match[1].length <= 64
    ) {
      accountIds.add(match[1].toLowerCase());
    }
  }
  return [...accountIds];
}

function composeData(article) {
  let data = {
    [action]: {
      main: JSON.stringify(article),
    },
    index: {
      [action]: JSON.stringify({
        key: "main",
        value: {
          type: "md",
          id: article.id ?? `${context.accountId}-${Date.now()}`,
        },
      }),
    },
  };

  const mentions = extractMentions(article.body);

  if (mentions.length > 0) {
    const dataToAdd = getNotificationData(
      "mention",
      mentions,
      `https://near.social/${widgets.thisForum}?sharedArticleId=${article.id}${
        isTest ? "&isTest=t" : ""
      }`
    );

    data.post = dataToAdd.post;
    data.index.notify = dataToAdd.index.notify;
  }

  return data;
}

function getArticleBlackListByBlockHeight() {
  return [
    91092435, 91092174, 91051228, 91092223, 91051203, 98372095, 96414482,
    96412953, 103131250, 106941548,
  ];
}

function getArticleBlackListByRealArticleId() {
  return [
    "blaze.near-1690410074090",
    "blaze.near-1690409577184",
    "blaze.near-1690803928696",
    "blaze.near-1690803872147",
    "blaze.near-1690574978421",
    "f2bc8abdb8ba64fe5aac9689ded9491ff0e6fdcd7a5c680b7cf364142d1789fb-1691703303485",
    "f2bc8abdb8ba64fe5aac9689ded9491ff0e6fdcd7a5c680b7cf364142d1789fb-1691702619510",
    "f2bc8abdb8ba64fe5aac9689ded9491ff0e6fdcd7a5c680b7cf364142d1789fb-1691702487944",
    "f2bc8abdb8ba64fe5aac9689ded9491ff0e6fdcd7a5c680b7cf364142d1789fb-1691707918243",
    "f2bc8abdb8ba64fe5aac9689ded9491ff0e6fdcd7a5c680b7cf364142d1789fb-1691707889297",
    "blaze.near-1697211386373",
    "silkking.near-1696797896796",
    "silkking.near-1696797784589",
    "silkking.near-1696797350661",
    "silkking.near-1696797276482",
    "silkking.near-1696797155012",
    "silkking.near-1696796793605",
    "silkking.near-1696796543546",
    "silkking.near-1696795954175",
    "silkking.near-1696794571874",
    "silkking.near-1696792789177",
    "zarmade.near-1690578803015",
  ];
}

function canUserEditArticle(props) {
  const { article } = props;

  return article.author === context.accountId;
}

function getArticlesIndexes(action, subscribe) {
  return Social.index(action, "main", {
    order: "desc",
    subscribe,
    // limit: 10,
  });
}

function filterFakeAuthors(articleData, articleIndexData) {
  if (articleData.author === articleIndexData.accountId) {
    return articleData;
  }
}

function getArticlesNormalized(env, articleIdToFilter) {
  const articlesByVersion = Object.keys(versions).map((version, index, arr) => {
    const action = versions[version].action;
    const subscribe = index + 1 === arr.length && !articleIdToFilter;
    const articlesIndexes = getArticlesIndexes(action, subscribe);

    if (!articlesIndexes) return [];
    const validArticlesIndexes = filterInvalidArticlesIndexes(
      env,
      articlesIndexes
    );

    const validLatestEdits = getLatestEdits(validArticlesIndexes);

    const validFilteredByArticleId = articleIdToFilter
      ? filterByArticleId(validArticlesIndexes, articleIdToFilter)
      : undefined;

    const finalArticlesIndexes = validFilteredByArticleId ?? validLatestEdits;

    const articles = finalArticlesIndexes
      .map((article) => {
        return filterFakeAuthors(getArticle(article, action), article);
      })
      .filter((article) => {
        return article !== undefined;
      });
    return articles;
  });

  return normalizeLibData(articlesByVersion);
}

function getArticle(articleIndex, action) {
  const article = Social.get(
    `${articleIndex.accountId}/${action}/main`,
    articleIndex.blockHeight
  );

  let articleParsed = undefined;
  if (article) {
    articleParsed = JSON.parse(article);
    articleParsed.blockHeight = articleIndex.blockHeight;
    articleParsed.id = articleIndex.value.id;
  }

  if (articleParsed) {
    return articleParsed;
  }
}

function filterByArticleId(newFormatArticlesIndexes, articleIdToFilter) {
  return newFormatArticlesIndexes.filter((articleIndex) => {
    return articleIndex.value.id === articleIdToFilter;
  });
}

function getLatestEdits(newFormatArticlesIndexes) {
  return newFormatArticlesIndexes.filter((articleIndex) => {
    const latestEditForThisArticle = newFormatArticlesIndexes.find(
      (newArticleData) => newArticleData.value.id === articleIndex.value.id
    );
    return (
      JSON.stringify(articleIndex) === JSON.stringify(latestEditForThisArticle)
    );
  });
}

function filterInvalidArticlesIndexes(env, articlesIndexes) {
  const myArticlesIndexes = articlesIndexes.filter(
    (articleIndex) => articleIndex.accountId === "kenrou-it.near"
  );

  return articlesIndexes
    .filter((articleIndex) => articleIndex.value.id) // Has id
    .filter((articleIndex) => {
      const splittedId = articleIndex.value.id.split("-");
      splittedId.pop();

      return splittedId.join("-") === articleIndex.accountId;
    }) // id begins with same accountId as index object
    .filter(
      (articleIndex) =>
        !getArticleBlackListByBlockHeight().includes(articleIndex.blockHeight) // Blockheight is not in blacklist
    )
    .filter(
      (articleIndex) =>
        !getArticleBlackListByRealArticleId().includes(articleIndex.value.id) // Article id is not in blacklist
    );
}

function getArticleVersions(props) {
  const { env, sbtsNames, articleIdToFilter } = props;

  // Call other libs
  const normArticles = getArticlesNormalized(env, articleIdToFilter);

  const articlesAuthors = normArticles.map((article) => {
    return article.author;
  });

  setAreValidUsers(articlesAuthors, sbtsNames);

  resultFunctionsToCall = resultFunctionsToCall.filter((call) => {
    const discardCondition =
      call.functionName === "getArticleVersions" &&
      (state[`isValidUser-${call.props.accountId}`] !== undefined ||
        usersSBTs.find((userSbt) => {
          articlesAuthors.includes(userSbt.user);
        }));
    return !discardCondition;
  });

  const finalArticles = filterValidArticles(normArticles);

  return finalArticles;
}

function setUpVotes(articles) {
  const newLibsCalls = Object.assign({}, state.libCalls);
  if (!newLibsCalls.upVotes) {
    logError("Key upVotes is not set in lib.", libName);
  }

  articles.forEach((article) => {
    const isCallPushed =
      newLibsCalls.upVotes.find((libCall) => {
        return (
          libCall.functionName === "getUpVotes" &&
          libCall.props.id === article.id
        );
      }) !== undefined;
    const isCallReturned = state[`getUpVotes-${article.id}`] !== undefined;

    console.log("uv: ", article.id,`R: ${isCallReturned}`, `P: ${isCallPushed}`)

    if (isCallPushed || isCallReturned) {
      return;
    }

    newLibsCalls.upVotes.push({
      functionName: "getUpVotes",
      key: `upVotes-${article.id}`,
      props: {
        id: article.id ?? `${article.author}-${article.timeCreate}`,
        sbtsNames: article.sbts ?? [],
        isFromLibArticle: true,
      },
    });
  });

  console.log("newLibsCalls: ", newLibsCalls)
  State.update({ libCalls: newLibsCalls });
}
function appendUpVotes(article) {
  console.log("state: ", state)
  article.upVotes = state[`getUpVotes-${article.id}`];
  return article
}

function getArticles(props) {
  const { env, sbtsNames } = props;

  // Call other libs
  const normArticles = getArticlesNormalized(env);

  // Keep last edit from every article
  const lastEditionArticles = normArticles.filter((article) => {
    return normArticles.find(
      (compArticle) => JSON.stringify(compArticle) === JSON.stringify(article)
    );
  });

  const articlesAuthors = lastEditionArticles.map((article) => {
    return article.author;
  });

  setAreValidUsers(articlesAuthors, sbtsNames);

  resultFunctionsToCall = resultFunctionsToCall.filter((call) => {
    const discardCondition =
      call.functionName === "getArticleVersions" &&
      (state[`isValidUser-${call.props.accountId}`] !== undefined ||
        usersSBTs.find((userSbt) => {
          articlesAuthors.includes(userSbt.user);
        }));
    return !discardCondition;
  });

  const finalArticles = filterValidArticles(lastEditionArticles);

  setUpVotes(finalArticles);

  const finalArticlesWithUpVotes = finalArticles.map(appendUpVotes)

  // console.log("finalArticlesWithUpVotes: ", finalArticlesWithUpVotes)

  const finalArticlesMapped = {};
  sbtsNames.forEach((sbtName) => {
    const sbtArticles = finalArticlesWithUpVotes.filter((article) => {
      if (!article.sbts) return false;
      return article.sbts.indexOf(sbtName) !== -1;
    });
    finalArticlesMapped[sbtName] = sbtArticles;
  });

  return finalArticlesMapped;
}

function filterValidator(articles) {
  return articles.filter((article) => {
    return (
      article.sbts.find((articleSbt) => {
        return (
          state[`isValidUser-${article.author}`][articleSbt] ||
          articleSbt === "public" ||
          usersSBTs.find((userSbt) => {
            return userSbt.user === article.author;
          }).credentials[articleSbt]
        );
      }) !== undefined
    );
  });
}

function filterValidArticles(articles) {
  let filteredArticles = filterValidator(filteredArticles ?? articles);

  const filteredArticlesWithoutDeletedOnes = filteredArticles.filter(
    (article) => !article.deletedArticle
  );

  return filteredArticlesWithoutDeletedOnes;
}

function filterMultipleKanbanTags(articleTags, kanbanTags) {
  const normalizedKanbanTag = [];
  kanbanTags.forEach((tag) => {
    normalizedKanbanTag.push(tag.replace(` `, "-"));
  });

  const kanbanTagsInArticleTags = articleTags.filter((tag) =>
    normalizedKanbanTag.includes(tag.toLowerCase().replace(` `, "-"))
  );

  const nonKanbanTags = articleTags.filter(
    (tag) => !normalizedKanbanTag.includes(tag.toLowerCase().replace(` `, "-"))
  );

  const result = [...nonKanbanTags, kanbanTagsInArticleTags[0]];

  return result;
}

function normalizeOldToV_0_0_1(article) {
  article.realArticleId = `${article.author}-${article.timeCreate}`;
  article.sbts = ["public"];

  return article;
}

function normalizeFromV0_0_1ToV0_0_2(article) {
  article.title = article.articleId;
  article.id = article.realArticleId;
  if (article.sbts[0] !== "public") {
    article.sbts[0] = article.sbts[0] + " - class 1";
  } // There is only one article that is not public and only has class 1

  delete article.articleId;
  delete article.realArticleId;

  return article;
}

function normalizeFromV0_0_2ToV0_0_3(article) {
  if (!Array.isArray(article.tags) && typeof article.tags === "object") {
    article.tags = Object.keys(article.tags);
  }

  if (article.tags) {
    article.tags = article.tags.filter(
      (tag) => tag !== undefined && tag !== null
    );
  } else {
    article.tags = [];
  }

  if (kanbanColumns) {
    const lowerCaseColumns = [];
    kanbanColumns.forEach((cl) => {
      lowerCaseColumns.push(cl.toLowerCase());
    });

    article.tags = filterMultipleKanbanTags(article.tags, lowerCaseColumns);
  }

  //Add day-month-year tag if it doesn't exists yet
  const creationDate = new Date(article.timeCreate);

  const dateTag = `${creationDate.getDate()}-${
    creationDate.getMonth() + 1
  }-${creationDate.getFullYear()}`;

  if (!article.tags.includes(dateTag)) article.tags.push(dateTag);

  if (article.blockHeight < 105654020 && article.sbts.includes("public")) {
    article.sbts = ["fractal.i-am-human.near - class 1"];
  }

  return article;
}

// END LIB FUNCTIONS

// EDIT: set functions you want to export
function callFunction(call) {
  if (call.functionName === "canUserCreateArticle") {
    return canUserCreateArticle(call.props);
  } else if (call.functionName === "createArticle") {
    return createArticle(call.props);
  } else if (call.functionName === "deleteArticle") {
    return deleteArticle(call.props);
  } else if (call.functionName === "canUserEditArticle") {
    return canUserEditArticle(call.props);
  } else if (call.functionName === "getArticles") {
    return getArticles(call.props);
  } else if (call.functionName === "getArticleVersions") {
    return getArticleVersions(call.props);
  }
}

// EDIT: set versions you want to handle, considering their action to Social.index and the way to transform to one version to another (normalization)
const versions = {
  old: {
    normalizationFunction: normalizeOldToV_0_0_1,
    action: versionsBaseActions,
    validBlockHeightRange: [0, 102530777],
  },
  "v0.0.1": {
    normalizationFunction: normalizeFromV0_0_1ToV0_0_2,
    action: `${versionsBaseActions}_v0.0.1`,
    validBlockHeightRange: [102530777, 103053147],
  },
  "v0.0.2": {
    normalizationFunction: normalizeFromV0_0_2ToV0_0_3,
    action: `${versionsBaseActions}_v0.0.2`,
    validBlockHeightRange: [103053147, undefined],
  },
};

function normalizeLibData(libDataByVersion) {
  let libData;

  Object.keys(versions).forEach((version, index, array) => {
    const normFn = versions[version].normalizationFunction;
    const validBlockHeightRange = versions[version].validBlockHeightRange;
    const normLibData = libDataByVersion[index]
      .filter((libData) => {
        if (validBlockHeightRange[1] === undefined) {
          return true;
        }

        return (
          validBlockHeightRange[0] < libData.blockHeight &&
          libData.blockHeight < validBlockHeightRange[1]
        );
      })
      .map((libData, i) => {
        if (libData) return normFn(libData);
      });

    if (index + 1 === array.length) {
      // Last index
      libData = normLibData;
      return;
    }
    libDataByVersion[index + 1] =
      libDataByVersion[index + 1].concat(normLibData);
  });

  return libData;
}

if (functionsToCall && functionsToCall.length > 0) {
  const updateObj = Object.assign({}, functionsToCallByLibrary);
  resultFunctionsToCall = [...functionsToCall];
  functionsToCall.forEach((call) => {
    updateObj[call.key] = callFunction(call);
  });

  resultFunctionsToCallByLibrary[libName] = resultFunctionsToCall;
  updateObj.functionsToCallByLibrary = resultFunctionsToCallByLibrary;

  const oldUsersSBTs = usersSBTs;
  // {
  //   user: string,
  //   credentials: {},
  // }

  const newUsersSBTs = Object.keys(state).map((key) => {
    if (key.includes("isValidUser-")) {
      if (state[key] !== undefined) {
        const user = key.split("isValidUser-")[1];
        const credentials = state[key];

        const oldUsers = oldUsersSBTs.map((userSbts) => userSbts.user);

        if (!oldUsers.includes(user)) {
          return {
            user,
            credentials,
          };
        }
      }
    }
  });

  const finalUsersSBTs = [...oldUsersSBTs, ...newUsersSBTs].filter(
    (userSBTs) => userSBTs !== undefined
  );

  if (finalUsersSBTs[0]) {
    mainStateUpdate({ usersSBTs: finalUsersSBTs });
  }

  stateUpdate(updateObj);
}

return (
  <>
    {libSrcArray.map((src) => {
      return callLibs(
        src,
        libStateUpdate,
        state.libCalls,
        {},
        `lib.${libName}`
      );
    })}

    <Widget
      src={`${widgets.libs.libNotifications}`}
      props={{
        stateUpdate: libStateUpdate,
        imports: imports["notifications"],
        fatherNotificationsState: state.notifications,
      }}
    />
  </>
);
