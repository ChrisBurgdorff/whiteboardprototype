var myApp = angular.module('WhiteboardApp', []);

myApp.controller('LoginCtrl', ['$scope', '$http', function($scope, $http){
  $scope.signIn = function(){
    
  };
  $scope.signUp = function(){
    console.log("in signup function");
    var newUser = {
      firstName: $scope.firstName,
      lastName: $scope.lastName,
      email: $scope.email,
      password: $scope.password
    };
    $http({
      method: 'POST',
      url: '/api/register', 
      data: newUser})
      .then(function(response){
        console.log(response);
        alert("new user created");
    });
  };
}]);