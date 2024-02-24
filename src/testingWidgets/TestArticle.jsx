const { getArticles } = VM.require("sayalot.near/widget/lib.article")

const [articlesBySbt, setArticlesBySbt] = useState({})

function loadArticles() {
    getArticles().then((newArticles) => {
        console.log(111, newArticles)
        setArticlesBySbt(newArticles)
    })
}

useEffect(() => {
    loadArticles()
    setInterval(() => {
        console.log("Loading articles interval", Date.now() / 1000)
        loadArticles()
    }, 30000)
}, [])

return <>
    <div>
    {errors && errors.length ? errors.map((err, index) => {
        return <div key={index}>{err}</div>
    }) : "No error"}
    </div>
    <div>SBTs: {Object.keys(articlesBySbt).length}</div>
    <div>Articles: {Object.keys(articlesBySbt).reduce((sum, sbtName) => articlesBySbt[sbtName].length + sum, 0)}</div>
    {/* <button onClick={failNewCommunity}>Test fail new community</button>
    <button onClick={newCommunity}>Test new community</button>
    <button onClick={() => modifyCommunity(communities[0])}>Test edit community</button>
    <button onClick={removeCommunity}>Test remove community</button> */}
    { articlesBySbt && Object.keys(articlesBySbt).length && <div>
        {Object.keys(articlesBySbt).map((sbtName, index) => 
        {
            return (<div key={index}>{sbtName} {articlesBySbt[sbtName].length}</div>)
        })}
    </div>}
</>