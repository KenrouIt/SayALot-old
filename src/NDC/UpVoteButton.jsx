//NDC.UpVoteButton

const {
  isTest,
  authorForWidget,
  reactedElementData,
  widgets,
  disabled,
  articleSbts,
  upVotes: articleUpVotes,
  callLibs,
  baseActions,
} = props;

const data = reactedElementData;

const libSrcArray = [widgets.libs.libUpVotes];

const initLibCalls = {
  upVotes: [
    {
      functionName: "getUpVotes",
      key: "upVotesBySBT",
      props: {
        id: data.id ?? `${data.author}-${data.timeCreate}`,
        sbtsNames: articleSbts,
      },
    },
  ],
};
const initUpVotesBySBT = {};

if (!articleUpVotes) {
  State.init({
    functionsToCallByLibrary: initLibCalls,
    articleUpVotes: [],
    upVotesBySBT: initUpVotesBySBT,
  });
} else {
  State.init({
    articleUpVotes,
    functionsToCallByLibrary: { upVotes: [] },
  });
}

if (state.upVotesBySBT && Object.keys(state.upVotesBySBT).length > 0) {
  const key = Object.keys(state.upVotesBySBT)[0]; // There should always be one for now
  const newUpvotes = state.upVotesBySBT[key];
  if (JSON.stringify(state.articleUpVotes) !== JSON.stringify(newUpvotes)) {
    State.update({ articleUpVotes: newUpvotes });
  }
}

let upVotesData = state.articleUpVotes;

let userVote = upVotesData.find((vote) => vote.accountId === context.accountId);

let hasUserVoted = userVote !== undefined;

function getUpVoteButtonClass() {
  if (hasUserVoted) {ks
    return "info";
  } else {
    return "info outline";
  }
}

function stateUpdate(obj) {
  State.update(obj);
}

function upVoteButtonListener() {
  let newLibCalls = Object.assign({}, state.functionsToCallByLibrary);

  if (!hasUserVoted) {
    newLibCalls.upVotes.push({
      functionName: "addVote",
      key: "newVote",
      props: {
        id: data.id ?? `${data.author}-${data.timeCreate}`,
        articleSbts: data.sbts,
        articleAuthor: data.author,
      },
    });
  } else {
    newLibCalls.upVotes.push({
      functionName: "deleteVote",
      key: "deletedVote",
      props: {
        id: data.id ?? `${data.author}-${data.timeCreate}`,
        upVoteId: userVote.value.upVoteId,
      },
    });
  }
  State.update({ functionsToCallByLibrary: newLibCalls });
}

const IconContainer = styled.div`
    transform: rotate(-90deg);
  `;

const Icon = styled.i`
    margin: 0px !important;
  `;

const CallLibrary = styled.div`
    display: none;
  `;

return (
  <>
    <div title={disabled && "You don't own this SBT"}>
      <Widget
        src={widgets.views.standardWidgets.newStyledComponents.Input.Button}
        props={{
          children: (
            <div className="d-flex">
              <span>{`+${upVotesData.length}`}</span>
              <IconContainer>
                <Icon
                  className={`bi bi-fast-forward-fill ${
                    !disabled && "text-success"
                  }`}
                ></Icon>
              </IconContainer>
            </div>
          ),
          disabled,
          className: `${getUpVoteButtonClass()}`,
          size: "sm",
          onClick: upVoteButtonListener,
        }}
      />
    </div>

    <CallLibrary>
      {libSrcArray.map((src) => {
        return callLibs(
          src,
          stateUpdate,
          state.functionsToCallByLibrary,
          { baseAction: baseActions.upVoteBaseAction },
          "Up vote button"
        );
      })}
    </CallLibrary>
  </>
);
