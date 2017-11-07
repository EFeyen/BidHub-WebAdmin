/**
 * Created by hubspot on 11/16/14.
 * Modified by ncauldwell
 */
var auctionApp = angular.module('auctionApp', []);

auctionApp.controller('ItemCardsCtrl', function ($scope) {

    // TODO: The admin user has full CRUD permissions on the users collection.
    //       The username/password should NOT be listed here in plain text.
    //       Find some other, more secure way of doing this.
    var kinveyAppKey = "<your kinvey app key>";
    var adminUsername = "<your auction admin username>";
    var adminPassword = "<your auction admin password>";
    var auth = window.btoa(adminUsername+":"+adminPassword);

	$.ajax({
		type: "GET",
		url: "https://baas.kinvey.com/appdata/"+kinveyAppKey+"/items/?query={}&sort=name",
		beforeSend: function(xhr){
			xhr.setRequestHeader('Authorization', 'Basic '+auth);
		},
        success: function(result) {
            $scope.$apply(function(){
                $scope.items = result;
                var totalRaised = 0;
                var totalStartPrice = 0;
                var numBids = 0;
                var topBidCount = "";
                var topBidCountCur = 0;
                var topBidAmt = "";
                var topBidAmtCur = 0;
                var highestGrossing = "";
                var highestGrossingCur = 0;

                var noBidCount = 0;

                $scope.items.forEach(function(item) {
                    var gross = 0;
                    item.currentPrice.forEach(function(bidprice) {
                        totalRaised = totalRaised + bidprice;
                        gross = gross + bidprice;
                    });

                    if (item.currentPrice.length == 0) {
                        noBidCount = noBidCount + 1;
                    }

                    numBids = numBids + item.numberOfBids;

                    if (item.numberOfBids > topBidCountCur) {
                        topBidCount = item.numberOfBids + " bids - " + item.name + " by " + item.donorname;
                        topBidCountCur = item.numberOfBids;
                    }

                    if (item.currentPrice[0] > topBidAmtCur) {
                        topBidAmt = "$" + item.currentPrice[0] + ": " + item.name + " by " + item.donorname;
                        topBidAmtCur = item.currentPrice[0];
                    }

                    if (gross > highestGrossingCur) {
                        highestGrossingCur = gross;
                        highestGrossing = "$" + gross + ": " + item.name + " by " + item.donorname;
                    }

                    item.gross = gross;

                    item.bidObjs = [];
                    for (var i = 0; i < item.currentWinners.length; i++) {
                        item.bidObjs.push({"who": item.currentWinners[i], "amt": item.currentPrice[i]});
                    }
                });

                $scope.totalRaised = totalRaised;
                $scope.bidCount = numBids;
                $scope.mostPopularBidCount = topBidCount;

                $scope.mostPopularPrice = topBidAmt;

                $scope.highestGrossing = highestGrossing;
                $scope.itemCount = $scope.items.length;
                $scope.noBidCount = noBidCount;
            });
        }
    });

	$.ajax({
		type: "GET",
		url: 'https://baas.kinvey.com/user/'+kinveyAppKey+'/?query={"email":{"$nin":["'+adminUsername+'"]}}&sort={"bidderNumber":1,"sort_first":1,"sort_last":1}',
		beforeSend: function(xhr){
			xhr.setRequestHeader('Authorization', 'Basic '+auth);
		},
        success: function(result) {
            $scope.$apply(function(){
                $.each(result, function(i, val) {
	               	result[i].id = result[i]._id;
                    result[i].ect = result[i]._kmd.ect;
//                    result[i].bidderNumber = ("000" + result[i].bidderNumber).slice(-3);
                });
                $scope.users = result;
            });
        }
    });

	$scope.updateUser = function(id, bidnum)
    {
        var updatedUser = JSON.stringify({
        	"bidderNumber": bidnum,
        	"setBidNum": 1
		});

        var kinveyAppKey = "";
        var adminUsername = "";
        var adminPassword = "";
        var auth = window.btoa(adminUsername+":"+adminPassword);
    
        $.ajax({
            type: "PUT",
			url: "https://baas.kinvey.com/user/"+kinveyAppKey+"/" + id + "/",
			beforeSend: function(xhr){
				xhr.setRequestHeader('Authorization', 'Basic '+auth);
			},
			data: updatedUser,
			success: function () {
				location.reload();
			},
			contentType:"application/json; charset=utf-8",
			dataType:"json"
		});
	}        


    $scope.buildCSV = function() {
        var headers = ["item name", "donor name", "winner1", "bid1", "winner2", "bid2", "winner3", "bid3", "winner4", "bid4",
            "winner5", "bid5", "winner6", "bid6", "winner7", "bid7", "winner8", "bid8"];
        var data = [];

        $.each($scope.items, function(idx, item) {
            var name = item.name;
            var donor = item.donorname;

            var winnerName = "";
            var highestBids = "";

            if (item.qty > 1) {
                $.each(getBidsForItem(item.objectId), function(idx, bid) {
                    if (bid && idx < item.qty) {
                        winnerName += bid.name + " [" + bid.email + "] " + ((idx == item.qty - 1) ? "" : " & ");
                        highestBids += bid.amt + ((idx == item.qty - 1) ? "" : " & ");
                    }
                });
            }
            else {
                var bid = getBidsForItem(item.objectId)[0];
                if (bid) {
                    winnerName = bid.name + "[" + bid.email + "]";

                    if (bid.amt)
                        highestBids = bid.amt;
                }
            }

            data.push([name, donor, winnerName, highestBids]);
        });

        var csvContent = "data:text/csv;charset=utf-8,";
        csvContent += headers.join(",") + "\n";
        data.forEach(function(infoArray, index){
            dataString = infoArray.join(",");
            csvContent += dataString + "\n";
        });

        var encodedUri = encodeURI(csvContent);
        window.open(encodedUri);
    };

});

auctionApp.filter('orderObjectBy', function(){
    return function(input, attribute) {
        if (!angular.isObject(input)) return input;

        var array = [];
        for(var objectKey in input) {
            array.push(input[objectKey]);
        }

        array.sort(function(a, b){
            a = parseInt(a[attribute]);
            b = parseInt(b[attribute]);
            return b - a;
        });
        return array;
    }
});

auctionApp.filter('noFractionCurrency',
    [ '$filter', '$locale',
        function(filter, locale) {
            var currencyFilter = filter('currency');
            var formats = locale.NUMBER_FORMATS;
            return function(amount, currencySymbol) {
                var value = currencyFilter(amount, currencySymbol);
                var sep = value.indexOf(formats.DECIMAL_SEP);
                if(amount >= 0) {
                    return value.substring(0, sep);
                }
                return value.substring(0, sep) + ')';
            };
        }
    ]
);