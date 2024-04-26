// Option 1 - They manually copy slugs over to books
// Option 2 - I do this complex query shit



// NEW
// query:"title:author*",
const newsQuery = `query ($cursor: String) {
    articles(first: 2, after: $cursor) {
        edges {
            node {
                id
                title
                handle
                image {
                    url
                }
                product: metafield(namespace: "godine", key: "product") {
                    value
                    type
                }
            }
        }
        pageInfo {
            hasPreviousPage
            hasNextPage
            startCursor
            endCursor
        }
    }
}`;

const articlesFetchHeaders = new Headers();
articlesFetchHeaders.append('X-Shopify-Storefront-Access-Token', '0fc0056e09b62e93104f1e4d0f0b1dc1');
articlesFetchHeaders.append('Content-Type', 'application/json');
articlesFetchHeaders.append('Accept', 'application/json');

function getArticles(progress, cursor = null, articles = []) {
    return new Promise((resolve, reject) =>
        fetch('https://davidrgodine.myshopify.com/api/2024-04/graphql.json', {
            body: JSON.stringify({
                query: newsQuery,
                variables: {
                    cursor,
                },
            }),
            method: 'POST',
            headers: articlesFetchHeaders,
            redirect: 'follow',
        })
            .then((res) => {
                if (res.status !== 200) {
                    throw `${res.status}: ${res.statusText}`;
                }

                console.log(`res`, res);

                res
                    .text()
                    .then((textData) => {
                        const data = JSON.parse(textData).data.articles;
                        console.log(`data`, data);
                        const newsData = data.edges.map((obj) => obj.node);
                        articles = articles.concat(newsData);

                        if (data.pageInfo.hasNextPage) {
                            progress && progress(articles);
                            getArticles(progress, data.pageInfo.endCursor, articles).then(resolve).catch(reject);
                        } else {
                            resolve(articles);
                        }
                    })
                    .catch(reject);
            })
            .catch(reject)
    );
}

// render progress
function progressCallback(articles) {
    console.log(`${articles.length} loaded`);
}

getArticles(progressCallback)
    .then((articles) => {
        console.log(`articles`, articles); // all articles have been loaded

        const relevantArticles = articles.filter((article) => article.product?.value === "gid://shopify/Product/{{ product.id }}")
        console.log(`relevantArticles`, relevantArticles);

        // https://stackoverflow.com/questions/11840858/creating-nested-tags-using-document-createelement
    })
    .catch(console.error);