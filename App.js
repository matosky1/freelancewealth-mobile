import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { ActivityIndicator, View } from 'react-native';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { COLORS } from './src/utils/theme';

// Auth
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import ForgotPasswordScreen from './src/screens/ForgotPasswordScreen';
import ResetPasswordScreen from './src/screens/ResetPasswordScreen';

// Main screens
import DashboardScreen from './src/screens/DashboardScreen';
import IncomeScreen from './src/screens/IncomeScreen';
import ExpensesScreen from './src/screens/ExpensesScreen';
import TaxScreen from './src/screens/TaxScreen';
import ClientsScreen from './src/screens/ClientsScreen';
import InventoryScreen from './src/screens/InventoryScreen';
import InvoicesScreen from './src/screens/InvoicesScreen';
import ReportsScreen from './src/screens/ReportsScreen';
import AIScreen from './src/screens/AIScreen';
import ProfileScreen from './src/screens/ProfileScreen';

// Modal screens
import AddTransactionScreen from './src/screens/AddTransactionScreen';
import AddIncomeScreen from './src/screens/AddIncomeScreen';
import AddExpenseScreen from './src/screens/AddExpenseScreen';
import PricingScreen from './src/screens/PricingScreen';

const Stack = createStackNavigator();

function RootNavigator() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.ink, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={COLORS.gold} size="large" />
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false, animationEnabled: true }}>
      {user ? (
        <>
          {/* Main app screens — all use ScreenLayout with sidebar */}
          <Stack.Screen name="Dashboard" component={DashboardScreen} />
          <Stack.Screen name="Income" component={IncomeScreen} />
          <Stack.Screen name="Expenses" component={ExpensesScreen} />
          <Stack.Screen name="Tax" component={TaxScreen} />
          <Stack.Screen name="Clients" component={ClientsScreen} />
          <Stack.Screen name="Inventory" component={InventoryScreen} />
          <Stack.Screen name="Invoices" component={InvoicesScreen} />
          <Stack.Screen name="Reports" component={ReportsScreen} />
          <Stack.Screen name="AI" component={AIScreen} />
          <Stack.Screen name="Profile" component={ProfileScreen} />

          {/* Modals */}
          <Stack.Screen name="AddTransaction" component={AddTransactionScreen} options={{ presentation: 'modal' }} />
          <Stack.Screen name="AddIncome" component={AddIncomeScreen} options={{ presentation: 'modal' }} />
          <Stack.Screen name="AddExpense" component={AddExpenseScreen} options={{ presentation: 'modal' }} />
          <Stack.Screen name="Pricing" component={PricingScreen} options={{ presentation: 'modal' }} />
        </>
      ) : (
        <>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
          <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
          <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
        </>
      )}
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <NavigationContainer>
        <RootNavigator />
      </NavigationContainer>
    </AuthProvider>
  );
}