var myApp = angular.module('WhiteboardApp', []);

myApp.controller('LoginCtrl', ['$scope', '$http', function($scope, $http){
  $scope.signIn = function(){
    var existingUser = {
      email: $scope.email,
      password: $scope.password
    };
    $http({
      method: 'POST',
      url: '/api/login',
      data: existingUser})
      .then(function(response){
        if (response.status == 200) {
          //Error status
          console.log(response.data.message);
          $scope.errorMessage = response.data.message;
        } else if (response.status == 201) {
          //Good response
        } else {
          //Some other Error
          console.log(response.data.message);
          $scope.errorMessage = response.data.message;
        }
      })
  };
  $scope.signUp = function(){
    console.log("in signup function");
    var newUser = {
      firstName: $scope.firstName,
      lastName: $scope.lastName,
      email: $scope.newEmail,
      password: $scope.newPassword
    };
    $http({
      method: 'POST',
      url: '/api/register', 
      data: newUser})
      .then(function(response){
        if (response.status == 200) {
          console.log(response.data.message);
          $scope.errorMessage = response.data.message;
        } else if (response.status == 201) {
          //NEW USER CREATED
          //Do something
        }
        else {
          console.log(response.data.message);
          $scope.errorMessage = response.data.message;
        }
    });
  };
}]);