var url1 = "http://api.openweathermap.org/data/2.5/forecast?q=";
var url2 = "&APPID=ad8a0b856d591a7eb8795aaac18d08bc";


init();

//initialize website by applying history if it exists
function init(){
    setHistoryButtons();

    if(localStorage.history){
        var temp = JSON.parse(localStorage.history);
        if(temp.length !== 0){
            $("#main-jumbo").html(``);
            setForecast(temp[0]);
        }
    }
}

//Add a new input to the history array
function historyUpdate(input){
    if(!localStorage.history){
        localStorage.history = JSON.stringify([]);
    }
    var temp = JSON.parse(localStorage.history);

    if(temp.length === 8){
        temp.pop();
    }

    if(temp.indexOf(input) !== -1){
        return;
    }

    temp.unshift(input);

    localStorage.history = JSON.stringify(temp);

    setHistoryButtons();

}

//reset the history buttons
function setHistoryButtons(){
    if(!localStorage.history){
        return;
    }

    var temp = JSON.parse(localStorage.history);

    $(".history-container").html(``);

    temp.forEach(element => {
        $(".history-container").append(`<button type="button" class="btn btn-primary history-button" data-city="${element}">${element}</button>`);
    })
}

//Set the html for the bug container
function setForecast(input){
    var queryUrl = url1 + input + url2;

    $.ajax({
        url: queryUrl,
        method: "GET",
        error: function(){errorResponse(input)}
    }).then(function(response) {

        //get latitude and longitude for later
        var lat = parseInt(response.city.coord.lat).toFixed(2);
        var lon = parseInt(response.city.coord.lon).toFixed(2);

        var uviUrl = "http://api.openweathermap.org/data/2.5/uvi?APPID=ad8a0b856d591a7eb8795aaac18d08bc&lat=" + lat + "&lon=" + lon;

        //calculate fahrenheit from kelvin
        var fahren = (parseInt(response.list[0].main.temp) - 273.15) * (9/5) + 32;
        fahren = fahren.toFixed(0);

        //set weather on main jumbotron
        $("#main-jumbo").html(`

            <h1 class="display-8">${response.city.name} (${moment().format("l")})
            <img src="http://openweathermap.org/img/w/${response.list[0].weather[0].icon}.png" alt="${response.list[0].weather[0].description}"></h1>
            <p>Temperature: ${fahren} °F</p>
            <p>Humidity: ${response.list[0].main.humidity}%</p>
            <p>Wind Speed: ${response.list[0].wind.speed} MPH</p>
            <p id="uv-index"></p>
        
        `);

        //Go through the rest
        for(var i = 7, cardIndex = 0; i < parseInt(response.cnt); i += 8, cardIndex++){
            var $tempCard = $($("#forecast").children()[cardIndex]);

            //calculate fahrenheit from kelvin
            fahren = (parseInt(response.list[i].main.temp) - 273.15) * (9/5) + 32;
            fahren = fahren.toFixed(2);

            //set html
            $tempCard.html(`
            
                <h5 style="color: white;">${moment().add((cardIndex + 1), 'days').format('l')}</h5>
                <p><img src="http://openweathermap.org/img/w/${response.list[i].weather[0].icon}.png" alt=
                ${response.list[i].weather[0].description}"></p>
                <p class="forecast-card">Temperature: ${fahren} °F</p>
                <p class="forecast-card">Humidity: ${response.list[i].main.humidity}%</p>
            
            `);
        }

        //set forecast title
        $("#forecast-title").html(`<h3>5-Day Forecast:</h3>`);


        //get uv index
        $.ajax({
            url: uviUrl,
            method: "GET"
        }).then(function(response) {
            var uvi = parseFloat(response.value);
            var severity = "favorable";
            if(uvi > 6){
                severity = "severe";
            }
            else if(uvi > 3){
                severity = "moderate";
            }

            $("#uv-index").html(`uv index: <span class="${severity}">${uvi}</span>`);
        });
    });
}

//handles when something not in the api is searched
function errorResponse(input){

    //delete the broken search from history
    var temp = JSON.parse(localStorage.history);
    temp.splice(temp.indexOf(input), 1);
    localStorage.history = JSON.stringify(temp);

    //reset the history buttons
    setHistoryButtons();

}

function searchHandler(){
    var city = $(".input-text").val();
    $(".input-text").val("");
    if(city.trim() !== ""){
        historyUpdate(city);
        setForecast(city);
    }
}

//search button handler
$("#search-button").on("click", searchHandler);

//hisory button handler
$(".history-container").on("click", function(event) {
    var $element = $(event.target);
    if($element.hasClass("history-button")){
        setForecast($element.text());
    }
});