const { ProfileInlineBlock } = VM.require(
  "sayalot.near/widget/bosTest.Profile.InlineBlock"
);
const { FollowStats } = VM.require("sayalot.near/widget/bosTest.FollowStats");
const { FollowsYouBadge } = VM.require("sayalot.near/widget/bosTest.FollowsYouBadge");
const { FollowButton } = VM.require("sayalot.near/widget/bosTest.FollowButton");
const { PokeButton } = VM.require("sayalot.near/widget/bosTest.PokeButton");

function ProfilePopover(props) {
  const accountId = props.accountId;
  if (!accountId) {
    return "Requires accountID prop";
  }

  const description = Social.get(`${accountId}/profile/description`);

  const Description = styled.div`
    max-height: 8rem;
    position: relative;
    overflow: hidden;
    h1,
    .h1,
    h2,
    .h2,
    h3,
    .h3,
    h4,
    .h4,
    h5,
    .h5,
    h6,
    .h6 {
      font-size: 1.2rem;
      margin: 0;
    }
    p {
      margin: 0;
    }
    :after {
      content: "";
      position: absolute;
      z-index: 1;
      top: 4rem;
      left: 0;
      pointer-events: none;
      background-image: linear-gradient(
        to bottom,
        rgba(255, 255, 255, 0),
        rgba(255, 255, 255, 1) 90%
      );
      width: 100%;
      height: 4rem;
    }
  `;

  return (
    <div className="d-flex flex-column gap-1">
      <a
        href={`#/mob.near/widget/ProfilePage?accountId=${accountId}`}
        className="link-dark text-truncate"
      >
        {ProfileInlineBlock({ accountId, hideDescription: true })}
      </a>
      <Description>
        <Markdown text={description} />
      </Description>
      <div className="d-flex">
        <div className="me-3">{FollowStats({ accountId })}</div>

        {FollowsYouBadge({ accountId })}
      </div>
      <div className="d-flex gap-2">
        {FollowButton({ accountId })}

        {PokeButton({ accountId })}
      </div>
    </div>
  );
}

return { ProfilePopover };
