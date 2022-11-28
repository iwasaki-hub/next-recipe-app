import { PortableText, sanityClient, urlFor } from "../../lib/sanity";
import { useState } from "react";
import { useRouter } from "next/router";
import { Image } from "next/image";

const recipeQuery = `*[_type == "recipe" && slug.current == $slug][0]{
    _id,
    name,
    slug,
    mainImage,
    ingredient[]{
        _id,
        unit,
        wholeNumber,
        fraction,
        ingredient->{
            name
        }
    },
    instructions,
    likes,
  }`;

export default function OneRecipe({ data, preview }) {
  const [likes, setLikes] = useState(data?.recipe?.likes);
  const router = useRouter();
  if (router.isFallback) {
    return <div>Loading...</div>;
  }


  const addLike = async () => {
    const res = await fetch("/api/handle-like", {
      method: "POST",
      body: JSON.stringify({ _id: recipe._id }),
    }).catch((error) => console.log(error));

    const data = await res.json();
    setLikes(data.likes);
  };
  const { recipe } = data;

  return (
    <article className="recipe">
      <h1>{recipe.name}</h1>

      <button className="like-button" onClick={addLike}>
        {likes} 🥰
      </button>
      <main className="content">
        <Image src={urlFor(recipe?.mainImage).url()} alt={recipe.name} />
        <div className="breakdown">
          <ul className="ingredients">
            {recipe.ingredient?.map((ingredient) => (
              <li key={ingredient._id} className="ingredient">
                {ingredient?.wholeNumber}
                {ingredient?.fraction}
                {ingredient?.unit}
                <br />
                {ingredient?.ingredient?.name}
              </li>
            ))}
          </ul>
          {
            recipe.instructions &&
              recipe.instructions.map((objects) =>
                objects.children.map((i, index) => (
                  <p key={index} className="instructions">
                    {i.text}
                  </p>
                ))
              )

            // recipe.instructions[0].children.map((i , index) => (
            //     <p key={index}>{i.text}</p>
            // ))
          }
        </div>

        {/* <pre>{JSON.stringify(recipe.instructions[0].children, null, "\t")}</pre> */}
      </main>
    </article>
  );
}

export async function getStaticPaths() {
  const paths = await sanityClient.fetch(
    `*[_type == "recipe" && defined(slug.current)]{
            "params":{
                "slug": slug.current
            }
        } `
  );

  return {
    paths: paths,
    fallback: true,
  };
}

export async function getStaticProps({ params }) {
  const { slug } = params;
  const recipe = await sanityClient.fetch(recipeQuery, { slug });

  return {
    props: { data: { recipe }, preview: true },
  };
}
