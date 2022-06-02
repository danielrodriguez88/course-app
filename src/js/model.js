import { async } from 'regenerator-runtime';
import { API_URL } from './config.js';
import { RES_PER_PAGE } from './config.js';
// import { getJSON } from './helpers.js';
// import { sendJSON } from './helpers.js';
import { AJAX } from './helpers.js';

import { KEY } from './config.js';

export const state = {
  recipe: {},
  search: {
    query: '',
    results: [],
    page: 1,
    resultsPerPage: RES_PER_PAGE,
  },
  bookmark: [],
};

const createRecipeObject = function (data) {
  const { recipe } = data.data;
  return {
    id: recipe.id,
    title: recipe.title,
    publisher: recipe.publisher,
    sourceUrl: recipe.source_url,
    image: recipe.image_url,
    servings: recipe.servings,
    cookingTime: recipe.cooking_time,
    ingredients: recipe.ingredients,
    ...(recipe.key && { key: recipe.key }),
  };
};

export const loadRecipe = async function (id) {
  try {
    const data = await AJAX(`${API_URL}${id}?key=${KEY}`);
    state.recipe = createRecipeObject(data);

    if (state.bookmark.some(bookmark => bookmark.id === id))
      state.recipe.bookmark = true;
    else state.recipe.bookmark = false;

    // console.log(state.recipe);
  } catch (err) {
    console.error(`${err}💥💥💥`);
    throw err;
  }
};

export const loadSearchResults = async function (query) {
  try {
    state.search.query = query;

    const data = await AJAX(`${API_URL}?search=${query}&key=${KEY}`);
    // console.log(data);

    state.search.results = data.data.recipes.map(rec => {
      return {
        id: rec.id,
        title: rec.title,
        publisher: rec.publisher,
        image: rec.image_url,
        ...(rec.key && { key: rec.key }),
      };
    });
    state.search.page = 1;
  } catch (err) {
    console.error(`${err}💥💥💥`);
    throw err;
  }
};

export const getSearchResultsPage = function (page = state.search.page) {
  state.search.page = page;

  const start = (page - 1) * state.search.resultsPerPage; //0
  const end = page * state.search.resultsPerPage; //9

  return state.search.results.slice(start, end);
};

export const updateServings = function (newServings) {
  state.recipe.ingredients.map(ing => {
    ing.quantity = (ing.quantity * newServings) / state.recipe.servings;
  });
  //newQTY = oldQTY * newServings / oldServings
  state.recipe.servings = newServings;
};

const persist = function () {
  localStorage.setItem('bookmarks', JSON.stringify(state.bookmark));
};

export const addBookmark = function (recipe) {
  //add bookmark
  state.bookmark.push(recipe);

  //mark current recipe as bookmark
  if (recipe.id === state.recipe.id) state.recipe.bookmark = true;

  persist();
};

export const deleteBookmark = function (id) {
  //delete bookmark
  const index = state.bookmark.findIndex(el => el.id === id);
  state.bookmark.splice(index, 1);

  //mark current recipe as not a bookmark
  if (id === state.recipe.id) state.recipe.bookmark = false;

  persist();
};

const init = function () {
  const storage = localStorage.getItem('bookmarks');
  if (storage) state.bookmark = JSON.parse(storage);
};

init();
// console.log(state.bookmark);

const clearBookmarks = function () {
  localStorage.clear('bookmarks');
};
// clearBookmarks();

export const uploadRecipe = async function (newRecipe) {
  try {
    const ingredients = Object.entries(newRecipe) ///converts to array
      .filter(entry => entry[0].startsWith('ingredient') && entry[1] !== '')
      .map(ing => {
        const ingArr = ing[1].split(',').map(el => el.trim());
        if (ingArr.length !== 3)
          throw new Error(
            'Wrong ingredient format. Please use the correct format'
          );

        const [quantity, unit, description] = ingArr;

        return { quantity: quantity ? +quantity : null, unit, description };
      });
    const recipe = {
      title: newRecipe.title,
      source_url: newRecipe.sourceUrl,
      image_url: newRecipe.image,
      publisher: newRecipe.publisher,
      cooking_time: +newRecipe.cookingTime,
      servings: +newRecipe.servings,
      ingredients,
    };
    // console.log(recipe);

    const data = await AJAX(`${API_URL}?key=${KEY}`, recipe);
    state.recipe = createRecipeObject(data);
    addBookmark(state.recipe);
  } catch (err) {
    throw err;
  }
};
