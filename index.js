// index.js

let firstCard = undefined;
let secondCard = undefined;
let lockBoard = false;
let clickCount = 0;
let matchedCount = 0;
let totalPairs = 0;
let timer = null;
let timeLeft = 60;
let theme = "light";

async function getRandomPokemons(count) {
  const response = await fetch("https://pokeapi.co/api/v2/pokemon?limit=1500");
  const data = await response.json();
  const allPokemon = data.results;
  const shuffled = allPokemon.sort(() => 0.5 - Math.random());
  const selected = shuffled.slice(0, count);
  const promises = selected.map(async (pokemon) => {
    const res = await fetch(pokemon.url);
    const detail = await res.json();
    return {
      name: pokemon.name,
      image: detail.sprites.other["official-artwork"].front_default,
    };
  });
  return await Promise.all(promises);
}

function createCardElement(image, index) {
  return `
    <div class="card" data-index="${index}">
      <img class="front_face" src="${image}" id="img${index}" />
      <img class="back_face" src="back.webp" />
    </div>
  `;
}

function resetGame() {
  clearInterval(timer);
  $("#game_grid").empty();
  $("#clicks").text("0");
  $("#matched").text("0");
  $("#total").text("0");
  $("#timer").text("60");
  firstCard = undefined;
  secondCard = undefined;
  lockBoard = false;
  clickCount = 0;
  matchedCount = 0;
  totalPairs = 0;
  timeLeft = 60;
}

function startTimer() {
  timer = setInterval(() => {
    timeLeft--;
    $("#timer").text(timeLeft);
    if (timeLeft <= 0) {
      clearInterval(timer);
      alert("Game Over!");
      $(".card").off("click");
    }
  }, 1000);
}

async function setup() {
  resetGame();
  const pairCount = parseInt($("#difficulty").val());
  totalPairs = pairCount;
  $("#total").text(pairCount);

  if (pairCount === 3) {
    timeLeft = 10;
    $("#game_grid").css("grid-template-columns", "repeat(3, 1fr)");
  } else if (pairCount === 6) {
    timeLeft = 60;
    $("#game_grid").css("grid-template-columns", "repeat(4, 1fr)");
  } else if (pairCount === 10) {
    timeLeft = 90;
    $("#game_grid").css("grid-template-columns", "repeat(5, 1fr)");
  } else {
    timeLeft = 60;
    $("#game_grid").css("grid-template-columns", "repeat(3, 1fr)");
  }

  const pokemons = await getRandomPokemons(pairCount);
  const images = [];
  pokemons.forEach(p => images.push(p.image, p.image));
  const shuffled = images.sort(() => 0.5 - Math.random());

  shuffled.forEach((img, i) => {
    $("#game_grid").append(createCardElement(img, i));
  });

  startTimer();

  $(".card").on("click", function () {
    if (lockBoard || $(this).hasClass("flip")) return;
    $(this).addClass("flip");
    clickCount++;
    $("#clicks").text(clickCount);

    if (!firstCard) {
      firstCard = $(this).find(".front_face")[0];
    } else {
      secondCard = $(this).find(".front_face")[0];
      lockBoard = true;
      const firstParent = $(`#${firstCard.id}`).parent();
      const secondParent = $(`#${secondCard.id}`).parent();

      if (firstCard.src === secondCard.src) {
        matchedCount++;
        $("#matched").text(matchedCount);
        firstParent.off("click").data("matched", true);
        secondParent.off("click").data("matched", true);

        firstCard = undefined;
        secondCard = undefined;
        lockBoard = false;

        if (matchedCount === totalPairs) {
          clearInterval(timer);
          setTimeout(() => {
            alert("You Win!");
          }, 300); // allow some time for flip animation to finish
        }
      } else {
        setTimeout(() => {
          firstParent.removeClass("flip");
          secondParent.removeClass("flip");
          firstCard = undefined;
          secondCard = undefined;
          lockBoard = false;
        }, 1000);
      }
    }
  });
}

$("#start").on("click", setup);
$("#reset").on("click", resetGame);

$("#toggleTheme").on("click", () => {
  if (theme === "light") {
    $("body").addClass("dark");
    theme = "dark";
    $("#toggleTheme").text("Light Theme");
  } else {
    $("body").removeClass("dark");
    theme = "light";
    $("#toggleTheme").text("Dark Theme");
  }
});

$("#powerUp").on("click", () => {
  // Flip only unmatched cards
  $(".card").each(function () {
    if ($(this).data("matched") !== true) {
      $(this).addClass("flip");
    }
  });

  setTimeout(() => {
    $(".card").each(function () {
      if ($(this).data("matched") !== true) {
        $(this).removeClass("flip");
      }
    });
  }, 1000);
});

$(document).ready(setup);
$("#difficulty").on("change", setup);
