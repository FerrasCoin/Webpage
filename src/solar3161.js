const numberWithCommas = (x) => {
  var parts = x.toString().split(".");
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return parts.join(".");
}

function decodeStats(response, price) {
    if (response == null) return null;

    var result = response.result;
    if (result == null || result.length == null || result.length < 193) return null;

    var weiPerEther = new BigNumber("1000000000000000000", 10);
    var weiPerMEA = new BigNumber("10000", 10);

    var totalContributionExact = new BigNumber(result.substr(2, 64), 16).div(weiPerEther);
    var totalContributionMXNExact = totalContributionExact.times(new BigNumber(price));
    var originalConstributed = new BigNumber(result.substr(66, 64), 16).div(weiPerMEA);
    // Me fallaron las mates! que los wei y que los fineys y que los ether.
    var totalSupplyContributed = originalConstributed.plus(-130000000000000000000000000);
    return {
        ethPriceMxn: price,
        totalContribution: totalContributionExact.round(3, BigNumber.ROUND_DOWN),
        totalContributionMXN: totalContributionMXNExact.round(0, BigNumber.ROUND_DOWN),
        totalSupply: totalSupplyContributed,
        purchasingAllowed: new BigNumber(result.substr(132, 64), 16).isZero() == false
    };
}

function getStats(price) {
    var url = "https://api.etherscan.io/api?module=proxy&action=eth_call&to=0xe2f59fa2512535a32a153581c0de14d3fb24026a&data=0xc59d48470000000000000000000000000000000000000000000000000000000000000000&tag=latest";
    return $.ajax(url, {
        cache: false,
        dataType: "json"
    }).then(function (data) {
      return decodeStats(data, price);
   });
}

function getPriceMxn(){
   var url = "https://api.fixer.io/latest?base=USD&symbols=MXN";
   return $.ajax(url, {
      cache: false,
      dataType: "json"
   }).then(function (data) {
      if (data == null) return null;
      if (data.rates == null) return null;
      if (data.rates.MXN == null) return null;

      return parseFloat(data.rates.MXN);
   });
}

function getETHPrice(priceMxn) {
    var url = "https://api.etherscan.io/api?module=stats&action=ethprice";
    return $.ajax(url, {
        cache: false,
        dataType: "json"
    }).then(function (data) {
        if (data == null) return null;
        if (data.result == null) return null;
        if (data.result.ethusd == null) return null;
        return Math.round(parseFloat(data.result.ethusd) * priceMxn);
    });
}

function updatePage(stats) {
    if (stats == null) return;


    $("#total-ether").text(numberWithCommas(stats.totalContribution.toFixed(3)));
    if (stats.totalContribution.toNumber() <= 0) {
        $("#total-ether-message").text("No me agüito.");
    } else if (stats.totalContribution.toNumber() <= .02) {
        var cuantoFalta = new BigNumber(0.02).minus(stats.totalContribution);
        $("#total-ether-message").text("Faltan " + cuantoFalta.toFixed(3) + " para ganarle a 'Prodeum'!");
    } else if (stats.totalContribution.toNumber() <= 1) {
        $("#total-ether-message").text("Le voy a comprar algo bonito a mi mamá.");
    } else if (stats.totalContribution.toNumber() <= 10) {
        $("#total-ether-message").text("Si llegamos a 10, patrocino una peda en la condechi!");
    } else if (stats.totalContribution.toNumber() <= 50) {
        $("#total-ether-message").text("Si llegamos a 50, me postulo para diputado.");
    } else {
       $("#total-ether-message").text("¿Nos postulamos para presidente?");
    }

    $("#total-usd").text("$" + numberWithCommas(stats.totalContributionMXN.toFixed(0)));
    if (stats.totalContribution.toNumber() <= 0) {
        $("#total-mxn-message").text("Parecen Regios!");
    } else if (stats.totalContribution.toNumber() < 0.02) {
        $("#total-mxn-message").text("Para las chelas del fin.");
    } else if (stats.totalContribution.toNumber() < 0.3) {
        $("#total-mxn-message").text("Ya le gané al vato del 'Pene' coin!");
    }else if (stats.totalContribution.toNumber() < 1) {
        $("#total-mxn-message").text("Chingos de gente se subió al mame.");
    } else {
       $("#total-mxn-message").text("Ya soy rico!");
    }


    $("#total-tokens").text(numberWithCommas(stats.totalSupply.toFixed(0)));
    $("#total-tokens-message").text("Después del 17 de Marzo serán los únicos en circulación!");

    $("#stats").show();
}

function refresh() { getPriceMxn().then(getETHPrice).then(getStats).then(updatePage); }

$(function() {
    try {
        refresh();
        setInterval(refresh, 1000 * 60 * 5);
    } catch (err) { }
});
