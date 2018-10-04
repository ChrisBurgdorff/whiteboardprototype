var myApp = angular.module('WhiteboardApp', ['ngCookies']);

myApp.controller('LoginCtrl', ['$scope', '$http', '$cookies', function($scope, $http, $cookies){
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
          if (response.data.auth == true) {
            $cookies.put('token', response.data.token);
            $cookies.put('email', response.data.email);
            $cookies.put('firstName', response.data.firstName);
            $cookies.put('lastName', response.data.lastName);
            $scope.successMessage = "User signed in. Redirecting.";
          }
          console.log("Token MOTHERFUCKER:");
          console.log(response.data.token);
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
          console.log("Response from login coming next");
          console.log(response);
          if (response.data.auth == true) {
            $cookies.put('token', response.data.token);
            $cookies.put('email', response.data.email);
            $cookies.put('firstName', response.data.firstName);
            $cookies.put('lastName', response.data.lastName);
            $scope.successMessage = "User created. Redirecting.";
          }
          //NEW USER CREATED
          //Do something
        }
        else {
          console.log(response.data.message);
          $scope.errorMessage = response.data.message;
        }
    });
  };
  $scope.signOut = function() {
    $http({
      method: 'GET',
      url: '/api/logout'})
      .then(function(response){
        if (response.status == 200) {
          $cookies.remove('token');
          $cookies.remove('email');
          $cookies.remove('firstName');
          $cookies.remove('lastName');
          //Redirect to login screen
        } else {
          //SOME SORT OF ERROR HANDLING WHAT THE FUCK
        }
      });
  };
  $scope.protectedRoute = function() {
    $http({
      method: 'GET',
      url: '/me',
      headers: {
        'x-access-token': $cookies.get('token') 
      }});
  };
}]);