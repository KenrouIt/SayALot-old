// NDC.Forum.AllArticlesList

//===============================================INITIALIZATION=====================================================

let {
  isTest,
  stateUpdate,
  articlesToRender,
  tabs,
  widgets,
  addressForArticles,
  handleFilterArticles,
  handleOpenArticle,
  authorForWidget,
  initialCreateState,
  editArticleData,
  handleEditArticle,
  showCreateArticle,
  sbtWhiteList,
  sbts,
  categories,
  handleShareButton,
  handleShareSearch,
  canLoggedUserCreateArticles,
  filterBy,
  callLibs,
  baseActions,
  handleOnCommitArticle,
  sharedSearchInputValue,
} = props;

const libSrcArray = [widgets.libs.libUpVotes];

let initLibsCalls = { upVotes: [] };

//For the moment we'll allways have only 1 sbt in the array. If this change remember to do the propper work in lib.SBT and here.

initLibsCalls.upVotes = articlesToRender.map((article) => {
  return {
    functionName: "getUpVotes",
    key: `upVotes-${article.id}`,
    props: {
      id: article.id ?? `${article.author}-${article.timeCreate}`,
      sbtsNames: article.sbts ?? [],
    },
  };
});

if (articlesToRender.length > 0) {
  State.update({ libsCalls: initLibsCalls });
}

State.init({
  start: Date.now(),
  libsCalls: initLibsCalls,
  searchInputValue: sharedSearchInputValue ?? "",
});

if (state.upVotesBySBT && Object.keys(state.upVotesBySBT).length > 0) {
  const key = Object.keys(state.upVotesBySBT)[0]; // There should always be one for now
  const newUpvotes = state.upVotesBySBT[key];
  if (JSON.stringify(state.upVotes) !== JSON.stringify(newUpvotes)) {
    State.update({ upVotes: newUpvotes });
  }
}

let finalArticlesWithUpVotes = articlesToRender.map((article) => {
  if (state[`upVotes-${article.id}`]) {
    const key = Object.keys(state[`upVotes-${article.id}`])[0];
    const articleUpVotes = state[`upVotes-${article.id}`][key];
    article.upVotes = articleUpVotes;

    return article;
  }
});

const articlesFilteredBySerch =
  !state.searchInputValue || state.searchInputValue === ""
    ? finalArticlesWithUpVotes
    : finalArticlesWithUpVotes.filter((article) => {
        if (article.title && article.body && article.author) {
          return (
            article.title
              .toLowerCase()
              .includes(state.searchInputValue.toLowerCase()) ||
            article.body
              .toLowerCase()
              .includes(state.searchInputValue.toLowerCase()) ||
            article.author
              .toLowerCase()
              .includes(state.searchInputValue.toLowerCase())
          );
        } else {
          return true;
        }
      });

const fiveDaysTimeLapse = 432000000;

const newestArticlesWithUpVotes = articlesFilteredBySerch
  .filter((article) => article.timeLastEdit > Date.now() - fiveDaysTimeLapse)
  .sort((a, b) => b.timeLastEdit - a.timeLastEdit);

const olderArticlesWithUpVotes = articlesFilteredBySerch
  .filter((article) => article.timeLastEdit < Date.now() - fiveDaysTimeLapse)
  .sort((a, b) => b.upVotes.length - a.upVotes.length);

const sortedFinalArticlesWithUpVotes = [
  ...newestArticlesWithUpVotes,
  ...olderArticlesWithUpVotes,
];

//=============================================END INITIALIZATION===================================================

//===================================================CONSTS=========================================================

const AcordionContainer = styled.div`--bs-accordion-border-width: 0px!important;`;

const NoMargin = styled.div`margin: 0 0.75rem;`;

const AccordionBody = styled.div`padding: 0;`;

const ArticlesListContainer = styled.div`
    background-color: rgb(248, 248, 249);
    margin: 0;
  `;

const CallLibrary = styled.div`
    display: none;
  `;

const IconCursorPointer = styled.i`
    cursor: pointer;
  `;

const ShareSearchRow = styled.div`
    display: flex;
    justify-content: flex-start;
    align-content: center;
    margin-bottom: 1rem;
    margin-top: 1rem;
  `;

const ShareSearchText = styled.h6`
    margin-bottom: 0;
    margin-left: 1rem;
    margin-right: 1rem;
  `;

const SearchResult = styled.span`
    margin-left: 0.5rem;
    font-size: small;
  `;

//=================================================END CONSTS=======================================================

//==================================================FUNCTIONS=======================================================

function getDateLastEdit(timestamp) {
  const date = new Date(Number(timestamp));
  const dateString = {
    date: date.toLocaleDateString(),
    time: date.toLocaleTimeString(),
  };
  return dateString;
}

function allArticlesListStateUpdate(obj) {
  State.update(obj);
}

function handleSearch(e) {
  State.update({ searchInputValue: e.target.value });
}

//================================================END FUNCTIONS=====================================================
return (
  <>
    {showCreateArticle ? (
      <>
        <AcordionContainer className="accordion" id="accordionExample">
          <NoMargin className="accordion-item">
            <h2 className="accordion-header" id="headingOne">
              <button
                className="accordion-button collapsed border border-2"
                type="button"
                data-bs-toggle="collapse"
                data-bs-target="#collapseOne"
                aria-expanded="true"
                aria-controls="collapseOne"
              >
                <h6 className="m-0">+ Create post</h6>
              </button>
            </h2>
            <div
              id="collapseOne"
              className="accordion-collapse collapse"
              aria-labelledby="headingOne"
              data-bs-parent="#accordionExample"
            >
              <AccordionBody className="accordion-body">
                <Widget
                  src={widgets.views.editableWidgets.create}
                  props={{
                    isTest,
                    addressForArticles,
                    authorForWidget,
                    stateUpdate,
                    widgets,
                    initialCreateState,
                    editArticleData,
                    callLibs,
                    handleFilterArticles,
                    handleEditArticle,
                    initialBody: "",
                    canLoggedUserCreateArticles,
                    sbts,
                    categories,
                    baseActions,
                    handleOnCommitArticle,
                  }}
                />
              </AccordionBody>
            </div>
          </NoMargin>
        </AcordionContainer>
      </>
    ) : (
      <h6>You can't post since you don't own this SBT</h6>
    )}
    <Widget
      src={widgets.views.standardWidgets.styledComponents}
      props={{
        Input: {
          label: "Search",
          value: state.searchInputValue,
          type: "text",
          placeholder: "You can search by title, content or author",
          handleChange: handleSearch,
        },
      }}
    />
    {state.searchInputValue !== "" &&
      state.searchInputValue &&
      sortedFinalArticlesWithUpVotes.length > 0 && (
        <SearchResult className="text-secondary">
          {`Found ${sortedFinalArticlesWithUpVotes.length} articles searching for "${state.searchInputValue}"`}
        </SearchResult>
      )}
    <ShareSearchRow>
      <ShareSearchText>Share search</ShareSearchText>
      <Widget
        src={widgets.views.standardWidgets.newStyledComponents.Input.Button}
        props={{
          size: "sm",
          className: "info outline icon",
          children: <i className="bi bi-share"></i>,
          onClick: () => handleShareSearch(true, state.searchInputValue),
        }}
      />
    </ShareSearchRow>
    <NoMargin>
      {filterBy.parameterName === "tag" && (
        <div className="mt-3">
          <h6>Filter by tag:</h6>
          <div className="d-flex align-items-center ">
            <Widget
              src={
                widgets.views.standardWidgets.newStyledComponents.Element.Badge
              }
              props={{
                children: filterBy.parameterValue,
                variant: "round info",
                size: "lg",
              }}
            />
            <IconCursorPointer
              className="bi bi-x"
              onClick={() => handleFilterArticles({ filterBy: "", value: "" })}
            ></IconCursorPointer>
          </div>
        </div>
      )}
      <ArticlesListContainer className="row card-group py-3">
        {sortedFinalArticlesWithUpVotes.length > 0 ? (
          sortedFinalArticlesWithUpVotes.map((article, i) => {
            const authorProfileCall = Social.getr(`${article.author}/profile`);

            if (authorProfileCall) {
              article.authorProfile = authorProfileCall;
            }

            // If some widget posts data different than an array it will be ignored
            if (!Array.isArray(article.tags)) article.tags = [];
            return (
              <div key={article.id}>
                <Widget
                  src={widgets.views.editableWidgets.generalCard}
                  props={{
                    widgets,
                    isTest,
                    data: article,
                    displayOverlay: true,
                    renderReactions: true,
                    addressForArticles,
                    handleOpenArticle,
                    handleFilterArticles,
                    authorForWidget,
                    handleShareButton,
                    sbtWhiteList,
                    categories,
                    handleEditArticle,
                    callLibs,
                    baseActions,
                  }}
                />
              </div>
            );
          })
        ) : (
          <h5>{`No articles ${
            state.searchInputValue !== ""
              ? `haver been found searching for ${state.searchInputValue}`
              : "uploaded using this SBT yet"
          }`}</h5>
        )}
      </ArticlesListContainer>
    </NoMargin>
    <CallLibrary>
      {libSrcArray.map((src) => {
        return callLibs(
          src,
          allArticlesListStateUpdate,
          state.libsCalls,
          { baseAction: baseActions.upVoteBaseAction },
          "All articles list"
        );
      })}
    </CallLibrary>
  </>
);
