// NDC.Forum

//===============================================INITIALIZATION=====================================================
let {
  sharedBlockHeight,
  tagShared,
  isTest,
  accountId,
  sbtWhiteList,
  authorForWidget,
  widgets,
  brand,
  baseActions,
  createSbtOptions,
  kanbanColumns,
  kanbanRequiredTags,
  kanbanExcludedTags,
  sharedArticleId,
  sharedCommentId,
  sharedSearchInputValue,
  topicShared,
  callLibs,
  mainStateUpdate,
} = props;

const splitedTopic = topicShared ? topicShared.split("-class") : undefined;

const topicSharedFirstPart = splitedTopic && splitedTopic[0];
const topicSharedSecondPart = splitedTopic && splitedTopic[1];

if (topicSharedFirstPart !== "public" && topicSharedFirstPart !== undefined) {
  topicShared = `${topicSharedFirstPart} - class ${topicSharedSecondPart}`;
}

const categories = [
  // First category must be All categories
  {
    title: "All categories",
    color: "transparent",
    value: "All categories",
  },
  {
    title: "Uncategorized",
    color: "#b3b5b4",
    value: "Uncategorized",
  },
  {
    title: "Creatives",
    color: "#f7941d",
    value: "Creatives",
  },
  {
    title: "Community",
    color: "#92278f",
    value: "Community",
  },
  {
    title: "Open Web Sandbox",
    color: "#08c",
    value: "Open Web Sandbox",
  },
  {
    title: "Education",
    color: "#9eb83b",
    value: "Education",
  },
  {
    title: "Ecosystem",
    color: "#bf1e2e",
    value: "Ecosystem",
  },
  {
    title: "Development",
    color: "#0e76bd",
    value: "Development",
  },
  {
    title: "Marketing",
    color: "#f1592a",
    value: "Marketing",
  },
  {
    title: "Regional hubs",
    color: "#a461ef",
    value: "Regional hubs",
  },
  {
    title: "NEAR Digital Collective",
    color: "#652d90",
    value: "NEAR Digital Collective",
  },
  {
    title: "NEAR Gaming",
    color: "#652d90",
    value: "NEAR Gaming",
  },
  {
    title: "Staking",
    color: "#231f20",
    value: "Staking",
  },
  {
    title: "Potlock",
    color: "#ed207b",
    value: "Potlock",
  },
];

sharedBlockHeight = Number(sharedBlockHeight);

const initSbtsNames = topicShared ? [topicShared] : [sbtWhiteList[0]];

const sbtsNames = state.sbt;

const initLibsCalls = {
  article: [
    {
      functionName: "getArticles",
      key: "articles",
      props: {
        env: isTest ? "test" : "prod",
        sbtsNames: sbtWhiteList,
      },
    },
    {
      functionName: "canUserCreateArticle",
      key: "canLoggedUserCreateArticle",
      props: {
        accountId: context.accountId,
        sbtsNames: sbtWhiteList,
      },
    },
  ],
};

accountId = context.accountId;

const tabs = {
  SHOW_ARTICLES_LIST: { id: 0 },
  SHOW_ARTICLE: { id: 1 },
  ARTICLE_WORKSHOP: { id: 2 },
  SHOW_ARTICLES_LIST_BY_AUTHORS: { id: 3 },
  SHOW_KANBAN_VIEW: { id: 4 },
};

function getInitialFilter() {
  if (sharedBlockHeight) {
    return {
      parameterName: "getPost",
      parameterValue: sharedBlockHeight,
    };
  } else if (tagShared) {
    return {
      parameterName: "tag",
      parameterValue: tagShared,
    };
  } else if (authorShared) {
    return {
      parameterName: "author",
      parameterValue: authorShared,
    };
  } else if (sharedArticleId) {
    return {
      parameterName: "articleId",
      parameterValue: sharedArticleId,
    };
  } else {
    return {
      parameterName: "",
    };
  }
}

function getInitialTabId() {
  if (sharedBlockHeight || sharedArticleId) {
    return tabs.SHOW_ARTICLE.id;
  } else {
    return tabs.SHOW_ARTICLES_LIST.id;
  }
}

// userSBTs object type
// {
//   user: string,
//   credentials: {}
// }

State.init({
  displayedTabId: getInitialTabId(),
  articleToRenderData: {},
  filterBy: getInitialFilter(),
  authorsProfiles: [],
  functionsToCallByLibrary: initLibsCalls,
  sbtsNames: initSbtsNames,
  sbts: topicShared ? [topicShared] : initSbtsNames,
  firstRender: !isNaN(sharedBlockHeight) || typeof sharedArticleId === "string",
  category: categories[0].value,
  // usersSBTs: [],
});

// const usersSBTs = state.usersSBTs;

let newLibsCalls = state.functionsToCallByLibrary;

State.update({ libsCalls: newLibsCalls });

//=============================================END INITIALIZATION===================================================

//==================================================CONSTS==========================================================

const libSrcArray = [widgets.libs.libArticle];

const profile = props.profile ?? Social.getr(`${accountId}/profile`);

if (profile === null) {
  return "Loading";
}

let authorProfile = {};
if (state.filterBy.parameterName == "author") {
  authorProfile = Social.getr(`${state.filterBy.parameterValue}/profile`);
}

const navigationPills = [
  { id: tabs.SHOW_ARTICLES_LIST.id, title: "Articles" },
  { id: tabs.SHOW_ARTICLES_LIST_BY_AUTHORS.id, title: "Authors" },
  { id: tabs.SHOW_KANBAN_VIEW.id, title: "Kanban" },
];

const navigationButtons = [
  // { id: tabs.ARTICLE_WORKSHOP.id, title: "+Create article" },
];

const sbts = state.sbts;

const initialBodyAtCreation = state.editArticleData.body;
const canLoggedUserCreateArticle = state.canLoggedUserCreateArticle[sbts[0]];

//=================================================END CONSTS=======================================================

//=================================================GET DATA=========================================================
const finalArticles = state.articles;

function filterArticlesByCurrentCategory(allArticles) {
  return allArticles.filter((article) => {
    if (article.category) {
      return (
        article.category === state.category ||
        state.category === categories[0].value
      );
    } else {
      return (
        state.category === "Uncategorized" ||
        state.category === categories[0].value
      );
    }
  });
}

function getArticlesToRender() {
  if (
    (sharedBlockHeight || sharedArticleId) &&
    finalArticles &&
    state.firstRender
  ) {
    let finalArticlesSbts = Object.keys(finalArticles);
    let allArticles = [];

    finalArticlesSbts.forEach((sbt) => {
      allArticles = [...allArticles, ...finalArticles[sbt]];
    });

    const allCurrentCategoriesArticles =
      filterArticlesByCurrentCategory(allArticles);

    return allCurrentCategoriesArticles;
  } else {
    const finalArticlesOfCurrentCategory = finalArticles[sbts[0]]
      ? filterArticlesByCurrentCategory(finalArticles[sbts[0]])
      : finalArticles[sbts[0]];

    return finalArticlesOfCurrentCategory;
  }
}

const articlesToRender = getArticlesToRender() ?? [];

function filterArticlesByTag(tag, articles) {
  return articles.filter((article) => {
    return article.tags.includes(tag);
  });
}

function filterArticlesByAuthor(author, articles) {
  return articles.filter((article) => {
    return article.author === author;
  });
}

function filterOnePostByBlockHeight(blockHeight, articles) {
  if (articles) {
    return articles.filter((article) => article.blockHeight === blockHeight);
  } else {
    return [];
  }
}

function filterOnePostByArticleId(articleId, articles) {
  if (articles) {
    return articles.filter((article) => article.id === articleId);
  } else {
    return [];
  }
}

if (state.filterBy.parameterName === "tag") {
  articlesToRender = filterArticlesByTag(
    state.filterBy.parameterValue,
    articlesToRender
  );
} else if (state.filterBy.parameterName === "author") {
  articlesToRender = filterArticlesByAuthor(
    state.filterBy.parameterValue,
    articlesToRender
  );
} else if (state.filterBy.parameterName === "getPost") {
  articlesToRender = filterOnePostByBlockHeight(
    state.filterBy.parameterValue,
    articlesToRender
  );

  if (articlesToRender.length > 0) {
    State.update({ articleToRenderData: articlesToRender[0] });
  }
} else if (state.filterBy.parameterName === "articleId") {
  articlesToRender = filterOnePostByArticleId(
    state.filterBy.parameterValue,
    articlesToRender
  );

  if (articlesToRender.length > 0) {
    State.update({ articleToRenderData: articlesToRender[0] });
  }
}
//===============================================END GET DATA=======================================================

//=============================================STYLED COMPONENTS====================================================
const CallLibrary = styled.div`
  display: none;
`;

const SBTSelectorContainer = styled.div`
  margin-right: 1rem;
  max-width: 350px;
  width: 100%
`;

const ShareInteractionGeneralContainer = styled.div`
    position: fixed;
    display: flex;
    justify-content: center;
    align-items: center;
    top: 0;
    left: 0;
    height: 100vh;
    width: 100vw;
    backdrop-filter: blur(10px);
    z-index: 1;
`;

const ShareInteractionMainContainer = styled.div`
  display: flex;
  flex-direction: column;
  background: white;
  padding: 1rem;
  border-radious: 12px;
`;

const ClosePopUpContainer = styled.div`
  display: flex;  
  flex-direction: row-reverse;
`;

const CloseIcon = styled.div`
  cursor: pointer;
`;

const PopUpDescription = styled.p`
  color: #474D55;
`;

const ShowLinkShared = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: #F2F6FA;
  padding: 1rem 2rem;
  border-radius: 17px;
`;

const LinkShared = styled.span`
  color: #0065FF;
  word-wrap: anywhere;
`;

const ClipboardContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-left: 0.5rem;
  min-width: 2.5rem;
`;

const ClipboardIcon = styled.i`
  color: ${state.linkCopied ? "#0065FF" : "black"};
  transition: color 0.3s linear;
  cursor: pointer;
`;

const CopiedFeedback = styled.span`
  font-size: 0.7rem;
  color: #6c757d;
`;

const SmallButton = styled.button`
position: relative;
  border: 0;
  background: transparent;
  width: 35px;
  height: 35px;
`;
//===========================================END STYLED COMPONENTS==================================================

//================================================COMPONENTS========================================================
const renderShareInteraction = () => {
  return (
    <ShareInteractionGeneralContainer>
      <ShareInteractionMainContainer>
        <ClosePopUpContainer>
          <CloseIcon
            className="bi bi-x"
            onClick={() =>
              State.update({
                showShareSearchModal: false,
                showShareModal: false,
                linkCopied: false,
                sharedElement: undefined,
                sharingSearch: false,
              })
            }
          ></CloseIcon>
        </ClosePopUpContainer>
        <h3>Share</h3>
        <PopUpDescription>
          {state.sharedElement.value
            ? "Use this link to share the article"
            : state.sharingSearch
            ? "Use this link to share the search"
            : "Can't share yet. Reload the app and try again."}
        </PopUpDescription>
        <ShowLinkShared>
          {(state.sharedElement.value || state.sharingSearch) && (
            <LinkShared>{getLink()}</LinkShared>
          )}
          <ClipboardContainer>
            {(state.sharedElement.value || state.sharingSearch) && (
              <ClipboardIcon
                className="bi-clipboard"
                onClick={() => {
                  clipboard.writeText(getLink());
                  State.update({ linkCopied: true });
                }}
              />
            )}
            {state.linkCopied && <CopiedFeedback>Copied!</CopiedFeedback>}
          </ClipboardContainer>
        </ShowLinkShared>
      </ShareInteractionMainContainer>
    </ShareInteractionGeneralContainer>
  );
};

const renderDeleteModal = () => {
  const ModalCard = styled.div`
    position: fixed;
    z-index: 1;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    background: rgba(0, 0, 0, 0.7);
  `;
  const ModalContainer = styled.div`
    display: flex;
    width: 400px;
    padding: 20px;
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
    border-radius: 10px;
    background: #fff;
    border: 1px solid transparent;
    margin-left: auto;
    margin-right: auto;
    margin-buttom: 50%;
    @media only screen and (max-width: 480px) {
      width: 90%;
    }
  `;
  const Container = styled.div`
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 20px;
    align-self: stretch;
  `;
  const Footer = styled.div`
    display: flex;
    flex-direction: row;
    align-items: flex-end;
    justify-content: end;
    gap: 16px;
    align-self: stretch;
  `;

  return (
    <ModalCard>
      <ModalContainer>
        <Container>
          <h3 className="w-100">Delete this post?</h3>
          <Footer>
            <Widget
              src={
                widgets.views.standardWidgets.newStyledComponents.Input.Button
              }
              props={{
                children: "Yes, delete it",
                onClick: deletePostListener,
                variant: "danger",
              }}
            />
            <Widget
              src={
                widgets.views.standardWidgets.newStyledComponents.Input.Button
              }
              props={{
                children: "Cancel",
                onClick: closeDeleteArticleModal,
                variant: "info outline",
              }}
            />
          </Footer>
        </Container>
      </ModalContainer>
    </ModalCard>
  );
};

const renderSelectorLabel = (isSBTSelector) => {
  return (
    <>
      <span>
        {isSBTSelector ? "Post & Filter Topics by SBT" : "Category filter"}
      </span>

      <SmallButton>
        <OverlayTrigger
          placement="top"
          overlay={
            <Tooltip>
              <p className="m-0">
                {isSBTSelector
                  ? "Topics for Community SBT Holders."
                  : "Categories filter"}
              </p>
              {isSBTSelector && (
                <p className="m-0">Anyone can post to Public.</p>
              )}
            </Tooltip>
          }
        >
          <i className="bi bi-info-circle"></i>
        </OverlayTrigger>
      </SmallButton>
    </>
  );
};
//==============================================END COMPONENTS======================================================

//=================================================FUNCTIONS========================================================
function stateUpdate(obj) {
  State.update(obj);
}

function handleShowOptions(showOptions) {
  State.update({ showOptions: !showOptions });
}

function onCommitDeletArticle() {
  State.update({
    showDeleteModal: false,
    deleteArticleData: undefined,
    displayedTabId: tabs.SHOW_ARTICLES_LIST.id,
    articleToRenderData: undefined,
    filterBy: { parameterName: "", parameterValue: {} },
    editArticleData: undefined,
  });
}

function deletePostListener() {
  //To test without commiting use the next line and comment the rest
  // onCommit();
  State.update({ saving: true });
  const article = state.deleteArticleData;

  const newLibsCalls = Object.assign({}, state.functionsToCallByLibrary);
  newLibsCalls.article.push({
    functionName: "deleteArticle",
    key: "deletedArticle",
    props: {
      article,
      onCommit: onCommitDeletArticle,
      onCancel: closeDeleteArticleModal,
    },
  });

  State.update({ functionsToCallByLibrary: newLibsCalls });
}

function getValidEditArticleDataTags() {
  let tags = state.editArticleData.tags ?? [];
  let newFormatTags = {};

  tags &&
    tags.map((tag) => {
      newFormatTags[tag] = "";
    });
  return newFormatTags;
}

const initialCreateState = {
  title: state.editArticleData.title ?? "",
  articleBody: state.editArticleData.body ?? initialBodyAtCreation,
  tags: state.editArticleData.tags ? getValidEditArticleDataTags() : {},
  libsCalls: { comment: {}, article: {}, emojis: {}, upVotes: {} },
  sbts: [sbtWhiteList[0]],
  category: categories[0],
};

// function mainStateUpdate(obj) {
//   State.update(obj);
// }

function handleOpenArticle(articleToRenderData) {
  State.update({
    displayedTabId: tabs.SHOW_ARTICLE.id,
    articleToRenderData,
    editArticleData: undefined,
  });
}

function handleEditArticle(articleData) {
  State.update({
    displayedTabId: tabs.ARTICLE_WORKSHOP.id,
    editArticleData: articleData,
  });
}

function handleDeleteArticle(articleData) {
  State.update({
    showDeleteModal: true,
    deleteArticleData: articleData,
  });
}

function closeDeleteArticleModal() {
  State.update({
    showDeleteModal: false,
    deleteArticleData: undefined,
  });
}

function handleFilterArticles(filter) {
  State.update({
    filterBy: {
      parameterName: filter.filterBy,
      parameterValue: filter.value,
    },
    displayedTabId: tabs.SHOW_ARTICLES_LIST.id,
    editArticleData: undefined,
  });
}

function handleBackButton() {
  props.editArticleData
    ? State.update({
        displayedTabId: tabs.SHOW_ARTICLE.id,
        editArticleData: undefined,
        firstRender: false,
        filterBy: {
          parameterName: "",
          parameterValue: undefined,
          handleBackClicked: true,
        },
      })
    : State.update({
        displayedTabId: tabs.SHOW_ARTICLES_LIST.id,
        articleToRenderData: {},
        editArticleData: undefined,
        firstRender: false,
        filterBy: {
          parameterName: "",
          parameterValue: undefined,
          handleBackClicked: true,
        },
      });
}

function handleGoHomeButton() {
  State.update({
    displayedTabId: tabs.SHOW_ARTICLES_LIST.id,
    articleToRenderData: {},
    filterBy: { parameterName: "", parameterValue: {} },
    editArticleData: undefined,
  });
}

function handlePillNavigation(navegateTo) {
  State.update({ displayedTabId: navegateTo, editArticleData: undefined });
}

function handleSbtSelection(selectedSbt) {
  State.update({
    sbts: [selectedSbt],
  });
}

function handleCategorySelection(selectedCategory) {
  State.update({
    category: selectedCategory,
  });
}

function handleShareButton(showShareModal, sharedElement) {
  //showShareModal is a boolean
  //sharedElement is and object like the example: {
  //   type: string,
  //   value: number||string,
  // }
  State.update({ showShareModal, sharedElement });
}

function handleShareSearch(showShareSearchModal, searchInputValue) {
  //showShareSearchModal is a boolean
  State.update({ showShareSearchModal, sharingSearch: true, searchInputValue });
}

function getLink() {
  if (state.sharingSearch) {
    return `https://near.social/${widgets.thisForum}?${isTest && "isTest=t&"}${
      state.filterBy.parameterName === "tag"
        ? `tagShared=${state.filterBy.parameterValue}&`
        : ""
    }topicShared=${sbts[0].replace(/\s+/g, "")}${
      state.searchInputValue !== "" &&
      `&sharedSearchInputValue=${state.searchInputValue}`
    }`;
  } else {
    return `https://near.social/${widgets.thisForum}?${isTest && "isTest=t&"}${
      state.sharedElement.type
    }=${state.sharedElement.value}`;
  }
}

function handleOnCommitArticle(articleToRenderData) {
  State.update({
    articleToRenderData,
    displayedTabId: tabs.SHOW_ARTICLE.id,
  });
}

//===============================================END FUNCTIONS======================================================
return (
  <>
    {state.showDeleteModal && renderDeleteModal()}
    {(state.showShareModal || state.showShareSearchModal) &&
      renderShareInteraction()}
    <Widget
      src={widgets.views.editableWidgets.header}
      props={{
        isTest,
        mainStateUpdate,
        handleGoHomeButton,
        handlePillNavigation,
        brand,
        pills: navigationPills,
        navigationButtons,
        displayedTabId: state.displayedTabId,
        handleFilterArticles,
        filterParameter: state.filterBy.parameterName,
        handleBackButton,
        tabs,
        sbtsNames,
        widgets,
      }}
    />
    {(state.displayedTabId == tabs.SHOW_ARTICLES_LIST.id ||
      state.displayedTabId == tabs.SHOW_KANBAN_VIEW.id) && (
      <div className="my-3 col-lg-8 col-md-8 col-sm-12 d-flex justify-content-between flex-wrap">
        <SBTSelectorContainer>
          <Widget
            src={widgets.views.standardWidgets.newStyledComponents.Input.Select}
            props={{
              label: renderSelectorLabel(true),
              value: sbts[0],
              onChange: handleSbtSelection,
              options: createSbtOptions(),
            }}
          />
        </SBTSelectorContainer>
        <SBTSelectorContainer>
          <Widget
            src={widgets.views.standardWidgets.newStyledComponents.Input.Select}
            props={{
              label: renderSelectorLabel(false),
              value: state.category,
              onChange: handleCategorySelection,
              options: categories,
            }}
          />
        </SBTSelectorContainer>
      </div>
    )}
    {articlesToRender && state.displayedTabId == tabs.SHOW_ARTICLES_LIST.id && (
      <Widget
        src={widgets.views.editableWidgets.showArticlesList}
        props={{
          isTest,
          articlesToRender,
          tabs,
          widgets,
          addressForArticles,
          handleOpenArticle,
          handleFilterArticles,
          authorForWidget,
          initialCreateState,
          editArticleData: state.editArticleData,
          handleEditArticle,
          showCreateArticle: canLoggedUserCreateArticle,
          sbtWhiteList,
          sbts,
          categories,
          handleShareButton,
          handleShareSearch,
          canLoggedUserCreateArticles,
          filterBy: state.filterBy,
          callLibs,
          baseActions,
          handleOnCommitArticle,
          sharedSearchInputValue,
        }}
      />
    )}
    {state.articleToRenderData.title &&
      state.displayedTabId == tabs.SHOW_ARTICLE.id && (
        <Widget
          src={widgets.views.editableWidgets.articleView}
          props={{
            isTest,
            widgets,
            handleFilterArticles,
            articleToRenderData: state.articleToRenderData,
            authorForWidget,
            handleEditArticle,
            handleShareButton,
            handleDeleteArticle,
            callLibs,
            baseActions,
            kanbanColumns,
            sharedCommentId,
            categories,
          }}
        />
      )}

    {state.displayedTabId == tabs.SHOW_ARTICLES_LIST_BY_AUTHORS.id && (
      <Widget
        src={widgets.views.editableWidgets.showArticlesListSortedByAuthors}
        props={{
          isTest,
          finalArticles,
          tabs,
          widgets,
          handleOpenArticle,
          handleFilterArticles,
          authorForWidget,
        }}
      />
    )}

    {state.displayedTabId == tabs.ARTICLE_WORKSHOP.id && (
      <Widget
        src={widgets.views.editableWidgets.create}
        props={{
          isTest,
          addressForArticles,
          authorForWidget,
          mainStateUpdate,
          widgets,
          initialBody: initialBodyAtCreation,
          initialCreateState,
          editArticleData: state.editArticleData,
          handleFilterArticles,
          handleEditArticle,
          sbtWhiteList,
          sbts,
          categories,
          canLoggedUserCreateArticles,
          callLibs,
          baseActions,
          handleOnCommitArticle,
        }}
      />
    )}

    {state.displayedTabId === tabs.SHOW_KANBAN_VIEW.id && (
      <Widget
        src={widgets.views.editableWidgets.kanbanBoard}
        props={{
          isTest,
          widgets,
          kanbanColumns,
          handleOpenArticle,
          handleFilterArticles,
          handleShareButton,
          authorForWidget,
          finalArticles,
          sbts,
          kanbanRequiredTags,
          kanbanExcludedTags,
          baseActions,
          callLibs,
        }}
      />
    )}

    <CallLibrary>
      {libSrcArray.map((src) => {
        return callLibs(
          src,
          stateUpdate,
          state.functionsToCallByLibrary,
          { baseAction: baseActions.articlesBaseAction, kanbanColumns },
          "NDC.Forum"
        );
      })}
    </CallLibrary>
  </>
);
