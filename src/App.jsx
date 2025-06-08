// App.jsx (Versión sin Firebase)
import React, { useState, createContext, useContext, useEffect } from 'react';
import {
  AppBar, Box, Toolbar, IconButton, Typography, Drawer,
  List, ListItem, ListItemIcon, ListItemText, Container,
  Grid, Card, CardContent, Button, TextField, Select,
  MenuItem, Table, TableBody, TableCell, TableHead,
  TableRow, Paper, Alert, Snackbar, TableContainer, CircularProgress
} from '@mui/material';
import {
  Menu as MenuIcon, Dashboard as DashboardIcon, Receipt as ReceiptIcon,
  Inventory as InventoryIcon, AccountBalance as AccountBalanceIcon,
  CreditCard as CreditCardIcon, Add as AddIcon, Delete as DeleteIcon,
  CheckCircle as CheckCircleIcon, Gavel as GavelIcon, AccountCircle as AccountCircleIcon
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';

// --- Contextos para la Gestión de Estado Global ---
// Proporciona una forma de compartir datos como la vista actual, productos, facturas entre componentes.
const AppContext = createContext();

// Componentes con estilos para una interfaz de usuario consistente.
const RootBox = styled(Box)(({ theme }) => ({
  display: 'flex',
  minHeight: '100vh',
  background: 'linear-gradient(to bottom right, #EEF2FF, #E0E7FF)', // from-indigo-50 to-blue-100
  fontFamily: 'Inter, sans-serif',
}));

const MainContentBox = styled(Box)(({ theme }) => ({
  flexGrow: 1,
  padding: theme.spacing(3),
  transition: theme.transitions.create('margin', {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  marginLeft: 0, // Por defecto para móvil, ajustado por el Drawer.
  [theme.breakpoints.up('lg')]: {
    marginLeft: 240, // Ancho de la barra lateral.
  },
}));

const SidebarDrawer = styled(Drawer)(({ theme }) => ({
  '& .MuiDrawer-paper': {
    width: 240,
    boxSizing: 'border-box',
    backgroundColor: '#3730A3', // indigo-800.
    color: 'white',
    borderTopRightRadius: theme.spacing(1.5), // rounded-r-lg.
    borderBottomRightRadius: theme.spacing(1.5),
    boxShadow: theme.shadows[8], // shadow-2xl.
  },
}));

const NavButton = styled(Button)(({ theme, active }) => ({
  justifyContent: 'flex-start',
  padding: theme.spacing(1.5, 2),
  borderRadius: theme.spacing(1),
  marginBottom: theme.spacing(1),
  textTransform: 'none',
  fontSize: '1.125rem', // text-lg.
  color: active ? 'white' : '#E0E7FF', // text-white : text-indigo-100.
  backgroundColor: active ? '#4F46E5' : 'transparent', // indigo-700.
  '&:hover': {
    backgroundColor: '#4F46E5', // indigo-700.
    boxShadow: theme.shadows[4], // shadow-md.
  },
}));

const SectionPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  borderRadius: theme.spacing(1.5), // rounded-xl.
  boxShadow: theme.shadows[4], // shadow-lg.
  border: '1px solid #E5E7EB', // gray-200.
  marginBottom: theme.spacing(4),
}));

const FormInput = styled(TextField)(({ theme }) => ({
  '& .MuiOutlinedInput-root': {
    borderRadius: theme.spacing(1), // rounded-lg.
  },
  '& .MuiOutlinedInput-notchedOutline': {
    borderColor: '#D1D5DB', // gray-300.
  },
  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
    borderColor: '#818CF8', // focus:ring-indigo-400.
    borderWidth: '2px',
  },
}));

// --- Components ---

// Sidebar Navigation Component
const Sidebar = ({ currentView, setView, toggleSidebar, isSidebarOpen, userId }) => {
  const navItems = [
    { id: 'dashboard', name: 'Dashboard', icon: DashboardIcon },
    { id: 'invoicing', name: 'Facturación', icon: ReceiptIcon },
    { id: 'inventory', name: 'Inventario', icon: InventoryIcon },
    { id: 'accountsPayable', name: 'Cuentas por Pagar', icon: AccountBalanceIcon },
    { id: 'accountsReceivable', name: 'Cuentas por Cobrar', icon: CreditCardIcon },
  ];

  const drawerContent = (
    <Box sx={{ p: 2 }}>
      <Typography variant="h5" component="h2" sx={{ fontWeight: 'bold', mb: 2, color: '#6EE7B7' }}> {/* emerald-300 */}
        RIMPE Invoice
      </Typography>
      {userId && ( // userId solo se muestra si está disponible (no aplica con datos ficticios)
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, p: 1, bgcolor: 'rgba(255,255,255,0.1)', borderRadius: '8px' }}>
          <AccountCircleIcon sx={{ mr: 1, color: '#E0E7FF' }} />
          <Typography variant="body2" sx={{ color: '#E0E7FF', fontSize: '0.8rem', wordBreak: 'break-all' }}>
            ID Usuario: {userId}
          </Typography>
        </Box>
      )}
      <List>
        {navItems.map((item) => (
          <ListItem key={item.id} disablePadding>
            <NavButton
              fullWidth
              onClick={() => {
                setView(item.id);
                toggleSidebar(); // Cierra la barra lateral en móvil después de la selección.
              }}
              active={currentView === item.id ? 1 : 0} // Pasa el estado activo como prop al componente estilizado.
            >
              <ListItemIcon sx={{ color: 'inherit', minWidth: 40 }}>
                <item.icon />
              </ListItemIcon>
              <ListItemText primary={item.name} />
            </NavButton>
          </ListItem>
        ))}
      </List>
    </Box>
  );

  return (
    <>
      {/* Drawer para móvil */}
      <SidebarDrawer
        variant="temporary"
        open={isSidebarOpen}
        onClose={toggleSidebar}
        ModalProps={{ keepMounted: true }} // Mejor rendimiento en móvil.
        sx={{ display: { xs: 'block', lg: 'none' } }}
      >
        {drawerContent}
      </SidebarDrawer>

      {/* Drawer para escritorio */}
      <SidebarDrawer
        variant="permanent"
        sx={{ display: { xs: 'none', lg: 'block' } }}
        open
      >
        {drawerContent}
      </SidebarDrawer>
    </>
  );
};

// Dashboard Component
const Dashboard = () => {
  // Ahora usamos el contexto para los datos ficticios
  const { invoices, products, accountsPayable } = useContext(AppContext);

  // Calcular métricas.
  const totalSales = invoices.reduce((sum, inv) => sum + inv.total, 0);
  const pendingInvoicesCount = invoices.filter(inv => inv.status === 'pending').length;
  const lowStockCount = products.filter(p => p.stock < 10).length; // Ejemplo: productos con menos de 10 unidades.
  const totalExpenses = accountsPayable.reduce((sum, item) => sum + item.amount, 0);

  const stats = [
    { name: 'Ventas Totales (USD)', value: `$${totalSales.toFixed(2)}`, color: '#059669', bgColor: '#D1FAE5', icon: ReceiptIcon }, // emerald-600, emerald-100.
    { name: 'Facturas Pendientes', value: pendingInvoicesCount, color: '#F97316', bgColor: '#FFEDD5', icon: CreditCardIcon }, // orange-600, orange-100.
    { name: 'Productos Bajo Stock', value: lowStockCount, color: '#EF4444', bgColor: '#FEE2E2', icon: InventoryIcon }, // red-600, red-100.
    { name: 'Cuentas por Pagar (USD)', value: `$${totalExpenses.toFixed(2)}`, color: '#9333EA', bgColor: '#EDE9FE', icon: AccountBalanceIcon }, // purple-600, purple-100.
  ];

  return (
    <SectionPaper>
      <Typography variant="h4" component="h2" sx={{ fontWeight: 'bold', mb: 3, color: '#2D3748', borderBottom: '2px solid #C7D2FE', pb: 2 }}>
        Dashboard
      </Typography>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        {stats.map((stat, index) => (
          <Grid item xs={12} sm={6} lg={3} key={index}>
            <Card
              sx={{
                borderRadius: '12px', // rounded-xl.
                boxShadow: 6, // shadow-lg.
                border: '1px solid #E5E7EB', // gray-200.
                transition: 'transform 0.3s ease-in-out',
                '&:hover': {
                  transform: 'scale(1.03)',
                },
              }}
            >
              <CardContent sx={{ display: 'flex', alignItems: 'center', p: 3 }}>
                <Box
                  sx={{
                    p: 1.5,
                    borderRadius: '50%',
                    backgroundColor: stat.bgColor,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mr: 2,
                  }}
                >
                  <stat.icon sx={{ color: stat.color, fontSize: 28 }} />
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 'medium' }}>{stat.name}</Typography>
                  <Typography variant="h5" sx={{ fontWeight: 'bold', color: stat.color }}>{stat.value}</Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3}>
        {/* Facturas Recientes */}
        <Grid item xs={12} lg={6}>
          <Card sx={{ borderRadius: '12px', boxShadow: 6, border: '1px solid #E5E7EB' }}>
            <CardContent>
              <Typography variant="h6" component="h3" sx={{ fontWeight: 'semibold', color: '#4A5568', mb: 2 }}>Facturas Recientes</Typography>
              <List disablePadding>
                {invoices.length === 0 ? (
                  <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic', textAlign: 'center', py: 2 }}>No hay facturas recientes.</Typography>
                ) : (
                  invoices.slice(0, 5).map((invoice) => (
                    <ListItem
                      key={invoice.id}
                      disableGutters
                      sx={{
                        backgroundColor: '#F9FAFB', // gray-50.
                        borderRadius: '8px', // rounded-lg.
                        border: '1px solid #F3F4F6', // gray-100.
                        mb: 1.5,
                        py: 1.5,
                        px: 2,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <Typography variant="body1" sx={{ fontWeight: 'medium', color: '#4A5568' }}>
                        #{invoice.invoiceNumber} - {invoice.customerName}
                      </Typography>
                      <Typography
                        variant="body1"
                        sx={{ fontWeight: 'semibold', color: invoice.status === 'paid' ? '#059669' : '#F97316' }}
                      >
                        ${invoice.total.toFixed(2)} ({invoice.status === 'paid' ? 'Pagada' : 'Pendiente'})
                      </Typography>
                    </ListItem>
                  ))
                )}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Productos Bajo Stock */}
        <Grid item xs={12} lg={6}>
          <Card sx={{ borderRadius: '12px', boxShadow: 6, border: '1px solid #E5E7EB' }}>
            <CardContent>
              <Typography variant="h6" component="h3" sx={{ fontWeight: 'semibold', color: '#4A5568', mb: 2 }}>Productos Bajo Stock</Typography>
              <List disablePadding>
                {products.filter(p => p.stock < 10).length === 0 ? (
                  <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic', textAlign: 'center', py: 2 }}>No hay productos bajo stock.</Typography>
                ) : (
                  products.filter(p => p.stock < 10).slice(0, 5).map((product) => (
                    <ListItem
                      key={product.id}
                      disableGutters
                      sx={{
                        backgroundColor: '#F9FAFB', // gray-50.
                        borderRadius: '8px', // rounded-lg.
                        border: '1px solid #F3F4F6', // gray-100.
                        mb: 1.5,
                        py: 1.5,
                        px: 2,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <Typography variant="body1" sx={{ fontWeight: 'medium', color: '#4A5568' }}>{product.name}</Typography>
                      <Typography variant="body1" sx={{ color: '#EF4444', fontWeight: 'semibold' }}>
                        Stock: {product.stock}
                      </Typography>
                    </ListItem>
                  ))
                )}
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </SectionPaper>
  );
};

// Invoicing Component
const Invoicing = () => {
  const { products, setProducts, invoices, setInvoices, setMessage } = useContext(AppContext);

  const [customerName, setCustomerName] = useState('');
  const [customerRUC, setCustomerRUC] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [invoiceItems, setInvoiceItems] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [quantity, setQuantity] = useState(1);

  // Calcular totales.
  const subtotal = invoiceItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const vatRate = 0.12; // IVA de Ecuador es 12%.
  const vat = subtotal * vatRate;
  const total = subtotal + vat;

  // Función para añadir ítem a la factura.
  const handleAddItem = () => {
    const productToAdd = products.find(p => p.id === selectedProduct);
    if (!productToAdd) {
      setMessage('Por favor, selecciona un producto.', 'error');
      return;
    }
    if (quantity <= 0) {
      setMessage('La cantidad debe ser mayor a cero.', 'error');
      return;
    }
    if (quantity > productToAdd.stock) {
      setMessage(`No hay suficiente stock para "${productToAdd.name}". Stock disponible: ${productToAdd.stock}`, 'warning');
      return;
    }

    const existingItemIndex = invoiceItems.findIndex(item => item.id === productToAdd.id);
    if (existingItemIndex > -1) {
      // Actualiza la cantidad si el ítem ya existe.
      const updatedItems = [...invoiceItems];
      updatedItems[existingItemIndex].quantity += quantity;
      setInvoiceItems(updatedItems);
    } else {
      setInvoiceItems([...invoiceItems, {
        id: productToAdd.id,
        name: productToAdd.name,
        price: productToAdd.price,
        quantity: quantity,
      }]);
    }
    setMessage('Producto añadido a la factura.', 'success');
    setSelectedProduct('');
    setQuantity(1);
  };

  // Función para eliminar ítem de la factura.
  const handleRemoveItem = (itemId) => {
    setInvoiceItems(invoiceItems.filter(item => item.id !== itemId));
    setMessage('Producto eliminado de la factura.', 'info');
  };

  // Función para generar factura. (Simulada)
  const handleGenerateInvoice = () => {
    if (!customerName || !customerRUC || !customerAddress) {
      setMessage('Por favor, completa todos los datos del cliente.', 'error');
      return;
    }
    if (invoiceItems.length === 0) {
      setMessage('La factura debe tener al menos un producto.', 'error');
      return;
    }

    // Simula la deducción de stock localmente
    const updatedProducts = products.map(p => {
      const soldItem = invoiceItems.find(item => item.id === p.id);
      if (soldItem) {
        return { ...p, stock: p.stock - soldItem.quantity };
      }
      return p;
    });
    setProducts(updatedProducts); // Actualiza el estado local de productos

    // Genera un número de factura único (simulación simple)
    const newInvoiceNumber = `INV-${Date.now().toString().slice(-6)}`;

    const newInvoice = {
      id: `inv-${Date.now()}`, // ID ficticio
      invoiceNumber: newInvoiceNumber,
      customerName,
      customerRUC,
      customerAddress,
      items: invoiceItems, // Esto se almacenará como un array de objetos
      subtotal: subtotal,
      vat: vat,
      total: total,
      date: new Date().toLocaleDateString('es-EC'),
      status: 'pending', // Estado por defecto
      createdAt: new Date(), // Marca de tiempo de creación
    };

    setInvoices(prevInvoices => [...prevInvoices, newInvoice]); // Agrega la nueva factura a la lista local
    setMessage('Factura generada exitosamente (simulado).', 'success');
    console.log('Factura generada (simulada):', newInvoice); // Para revisión en consola

    // Reinicia el formulario
    setCustomerName('');
    setCustomerRUC('');
    setCustomerAddress('');
    setInvoiceItems([]);
    setSelectedProduct('');
    setQuantity(1);
  };

  return (
    <SectionPaper>
      <Typography variant="h4" component="h2" sx={{ fontWeight: 'bold', mb: 3, color: '#2D3748', borderBottom: '2px solid #C7D2FE', pb: 2 }}>
        Facturación Electrónica (Simulada)
      </Typography>

      {/* Detalles del Cliente */}
      <SectionPaper sx={{ backgroundColor: '#F9FAFB', boxShadow: 3, border: '1px solid #F3F4F6', p: 3 }}>
        <Typography variant="h6" component="h3" sx={{ fontWeight: 'semibold', color: '#4A5568', mb: 2 }}>Datos del Cliente</Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <FormInput
              fullWidth
              label="Nombre del Cliente"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <FormInput
              fullWidth
              label="RUC / C.I."
              value={customerRUC}
              onChange={(e) => setCustomerRUC(e.target.value)}
            />
          </Grid>
          <Grid item xs={12}>
            <FormInput
              fullWidth
              label="Dirección del Cliente"
              value={customerAddress}
              onChange={(e) => setCustomerAddress(e.target.value)}
            />
          </Grid>
        </Grid>
      </SectionPaper>

      {/* Sección Añadir Producto */}
      <SectionPaper sx={{ backgroundColor: '#F9FAFB', boxShadow: 3, border: '1px solid #F3F4F6', p: 3 }}>
        <Typography variant="h6" component="h3" sx={{ fontWeight: 'semibold', color: '#4A5568', mb: 2 }}>Añadir Producto</Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} md={5}>
            <FormInput
              fullWidth
              select
              label="Selecciona un Producto"
              value={selectedProduct}
              onChange={(e) => setSelectedProduct(e.target.value)}
            >
              <MenuItem value="">Selecciona un Producto</MenuItem>
              {products.map((p) => (
                <MenuItem key={p.id} value={p.id}>
                  {p.name} (Stock: {p.stock})
                </MenuItem>
              ))}
            </FormInput>
          </Grid>
          <Grid item xs={12} md={3}>
            <FormInput
              fullWidth
              type="number"
              label="Cantidad"
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
              inputProps={{ min: 1 }}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <Button
              fullWidth
              variant="contained"
              sx={{
                height: '56px', // Coincide con la altura del TextField.
                backgroundColor: '#4F46E5', // indigo-600.
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)', // shadow-md.
                transition: 'transform 0.3s ease-in-out',
                '&:hover': {
                  backgroundColor: '#4338CA', // indigo-700.
                  transform: 'scale(1.05)',
                },
              }}
              startIcon={<AddIcon />}
              onClick={handleAddItem}
            >
              Añadir
            </Button>
          </Grid>
        </Grid>
      </SectionPaper>

      {/* Tabla de ítems de la Factura */}
      <SectionPaper sx={{ backgroundColor: '#F9FAFB', boxShadow: 3, border: '1px solid #E5E7EB', p: 3 }}>
        <Typography variant="h6" component="h3" sx={{ fontWeight: 'semibold', color: '#4A5568', mb: 2 }}>Detalle de la Factura</Typography>
        {invoiceItems.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic', textAlign: 'center', py: 2 }}>No hay productos en la factura.</Typography>
        ) : (
          <TableContainer component={Paper} sx={{ borderRadius: '8px', border: '1px solid #E5E7EB', boxShadow: 2 }}>
            <Table>
              <TableHead sx={{ backgroundColor: '#F9FAFB' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'medium', color: '#6B7280' }}>Producto</TableCell>
                  <TableCell sx={{ fontWeight: 'medium', color: '#6B7280' }}>Cantidad</TableCell>
                  <TableCell sx={{ fontWeight: 'medium', color: '#6B7280' }}>P. Unitario</TableCell>
                  <TableCell sx={{ fontWeight: 'medium', color: '#6B7280' }}>Subtotal</TableCell>
                  <TableCell sx={{ fontWeight: 'medium', color: '#6B7280' }}>Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {invoiceItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell sx={{ fontWeight: 'medium', color: '#1F2937' }}>{item.name}</TableCell>
                    <TableCell sx={{ color: '#4B5563' }}>{item.quantity}</TableCell>
                    <TableCell sx={{ color: '#4B5563' }}>${item.price.toFixed(2)}</TableCell>
                    <TableCell sx={{ color: '#4B5563' }}>${(item.quantity * item.price).toFixed(2)}</TableCell>
                    <TableCell align="right">
                      <IconButton
                        color="error"
                        onClick={() => handleRemoveItem(item.id)}
                        sx={{ transition: 'transform 0.2s', '&:hover': { transform: 'scale(1.2)' } }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </SectionPaper>

      {/* Resumen de Totales */}
      <Box
        sx={{
          p: 3,
          backgroundColor: '#EEF2FF', // indigo-50.
          borderRadius: '12px', // rounded-xl.
          boxShadow: 3, // shadow-md.
          border: '1px solid #C7D2FE', // indigo-200.
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
          textAlign: 'right',
          mb: 4,
        }}
      >
        <Typography variant="h6" sx={{ color: '#4A5568', mb: 1 }}>Subtotal: <span style={{ fontWeight: 'semibold', color: '#1F2937' }}>${subtotal.toFixed(2)}</span></Typography>
        <Typography variant="h6" sx={{ color: '#4A5568', mb: 2 }}>IVA (12%): <span style={{ fontWeight: 'semibold', color: '#1F2937' }}>${vat.toFixed(2)}</span></Typography>
        <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#3730A3' }}>Total: <span style={{ color: '#059669' }}>${total.toFixed(2)}</span></Typography>
      </Box>

      {/* Botón Generar Factura */}
      <Button
        fullWidth
        variant="contained"
        sx={{
          backgroundColor: '#059669', // emerald-600.
          color: 'white',
          fontWeight: 'bold',
          py: 2, // px-6 is default.
          borderRadius: '12px', // rounded-lg.
          boxShadow: '0 10px 15px rgba(0, 0, 0, 0.1)', // shadow-xl.
          transition: 'transform 0.3s ease-in-out',
          fontSize: '1.25rem', // text-xl.
          '&:hover': {
            backgroundColor: '#047857', // emerald-700.
            transform: 'scale(1.05)',
          },
        }}
        startIcon={<ReceiptIcon fontSize="large" />}
        onClick={handleGenerateInvoice}
      >
        Generar Factura Electrónica (Simulado)
      </Button>
    </SectionPaper>
  );
};

// Inventory Component
const Inventory = () => {
  const { products, setProducts, setMessage } = useContext(AppContext);
  const [productName, setProductName] = useState('');
  const [productPrice, setProductPrice] = useState(0);
  const [productStock, setProductStock] = useState(0);

  const handleAddProduct = () => {
    if (!productName || productPrice <= 0 || productStock < 0) {
      setMessage('Por favor, completa todos los campos del producto y asegúrate que el precio y stock sean válidos.', 'error');
      return;
    }
    const newProduct = {
      id: `prod-${Date.now()}`, // ID ficticio
      name: productName,
      price: parseFloat(productPrice),
      stock: parseInt(productStock),
    };
    setProducts(prevProducts => [...prevProducts, newProduct]); // Agrega el nuevo producto a la lista local
    setMessage('Producto añadido exitosamente (simulado).', 'success');
    setProductName('');
    setProductPrice(0);
    setProductStock(0);
  };

  const handleUpdateStock = (id, newStock) => {
    setProducts(prevProducts =>
      prevProducts.map(p =>
        p.id === id ? { ...p, stock: Math.max(0, parseInt(newStock) || 0) } : p
      )
    );
    setMessage('Stock actualizado (simulado).', 'info');
  };

  const handleDeleteProduct = (id) => {
    setProducts(prevProducts => prevProducts.filter(p => p.id !== id));
    setMessage('Producto eliminado (simulado).', 'info');
  };

  return (
    <SectionPaper>
      <Typography variant="h4" component="h2" sx={{ fontWeight: 'bold', mb: 3, color: '#2D3748', borderBottom: '2px solid #C7D2FE', pb: 2 }}>
        Gestión de Inventario (Simulada)
      </Typography>

      {/* Añadir Nuevo Producto */}
      <SectionPaper sx={{ backgroundColor: '#F9FAFB', boxShadow: 3, border: '1px solid #F3F4F6', p: 3 }}>
        <Typography variant="h6" component="h3" sx={{ fontWeight: 'semibold', color: '#4A5568', mb: 2 }}>Añadir Nuevo Producto</Typography>
        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={12} md={6}>
            <FormInput
              fullWidth
              label="Nombre del Producto"
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <FormInput
              fullWidth
              type="number"
              label="Precio Unitario"
              value={productPrice}
              onChange={(e) => setProductPrice(e.target.value)}
              inputProps={{ min: 0, step: 0.01 }}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <FormInput
              fullWidth
              type="number"
              label="Stock Inicial"
              value={productStock}
              onChange={(e) => setProductStock(e.target.value)}
              inputProps={{ min: 0 }}
            />
          </Grid>
        </Grid>
        <Button
          fullWidth
          variant="contained"
          sx={{
            backgroundColor: '#4F46E5', // indigo-600.
            color: 'white',
            fontWeight: 'bold',
            py: 1.5, // px-4 is default.
            borderRadius: '8px', // rounded-lg.
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)', // shadow-md.
            transition: 'transform 0.3s ease-in-out',
            '&:hover': {
              backgroundColor: '#4338CA', // indigo-700.
              transform: 'scale(1.05)',
            },
          }}
          startIcon={<AddIcon />}
          onClick={handleAddProduct}
        >
          Añadir Producto
        </Button>
      </SectionPaper>

      {/* Lista de Productos */}
      <SectionPaper sx={{ backgroundColor: '#F9FAFB', boxShadow: 3, border: '1px solid #E5E7EB', p: 3 }}>
        <Typography variant="h6" component="h3" sx={{ fontWeight: 'semibold', color: '#4A5568', mb: 2 }}>Productos en Inventario</Typography>
        {products.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic', textAlign: 'center', py: 2 }}>No hay productos en el inventario.</Typography>
        ) : (
          <TableContainer component={Paper} sx={{ borderRadius: '8px', border: '1px solid #E5E7EB', boxShadow: 2 }}>
            <Table>
              <TableHead sx={{ backgroundColor: '#F9FAFB' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'medium', color: '#6B7280' }}>Nombre</TableCell>
                  <TableCell sx={{ fontWeight: 'medium', color: '#6B7280' }}>Precio</TableCell>
                  <TableCell sx={{ fontWeight: 'medium', color: '#6B7280' }}>Stock</TableCell>
                  <TableCell sx={{ fontWeight: 'medium', color: '#6B7280' }}>Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {products.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell sx={{ fontWeight: 'medium', color: '#1F2937' }}>{product.name}</TableCell>
                    <TableCell sx={{ color: '#4B5563' }}>${product.price.toFixed(2)}</TableCell>
                    <TableCell>
                      <FormInput
                        type="number"
                        value={product.stock}
                        onChange={(e) => handleUpdateStock(product.id, e.target.value)}
                        size="small"
                        sx={{ width: 100 }}
                        inputProps={{ min: 0 }}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <IconButton
                        color="error"
                        onClick={() => handleDeleteProduct(product.id)}
                        sx={{ transition: 'transform 0.2s', '&:hover': { transform: 'scale(1.2)' } }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </SectionPaper>
    </SectionPaper>
  );
};

// Accounts Payable Component
const AccountsPayable = () => {
  const { accountsPayable, setAccountsPayable, setMessage } = useContext(AppContext);
  const [supplier, setSupplier] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState(0);
  const [dueDate, setDueDate] = useState('');

  const handleAddBill = () => {
    if (!supplier || !description || amount <= 0 || !dueDate) {
      setMessage('Por favor, completa todos los campos de la cuenta por pagar.', 'error');
      return;
    }
    const newBill = {
      id: `bill-${Date.now()}`, // ID ficticio
      supplier,
      description,
      amount: parseFloat(amount),
      dueDate,
      status: 'pending',
    };
    setAccountsPayable(prevBills => [...prevBills, newBill]); // Agrega la nueva cuenta a la lista local
    setMessage('Cuenta por pagar añadida (simulado).', 'success');
    setSupplier('');
    setDescription('');
    setAmount(0);
    setDueDate('');
  };

  const handleMarkAsPaid = (id) => {
    setAccountsPayable(prevBills =>
      prevBills.map(bill =>
        bill.id === id ? { ...bill, status: 'paid' } : bill
      )
    );
    setMessage('Cuenta por pagar marcada como pagada (simulado).', 'success');
  };

  const handleDeleteBill = (id) => {
    setAccountsPayable(prevBills => prevBills.filter(bill => bill.id !== id));
    setMessage('Cuenta por pagar eliminada (simulado).', 'info');
  };

  return (
    <SectionPaper>
      <Typography variant="h4" component="h2" sx={{ fontWeight: 'bold', mb: 3, color: '#2D3748', borderBottom: '2px solid #C7D2FE', pb: 2 }}>
        Cuentas por Pagar (Simuladas)
      </Typography>

      {/* Añadir Nueva Cuenta por Pagar */}
      <SectionPaper sx={{ backgroundColor: '#F9FAFB', boxShadow: 3, border: '1px solid #F3F4F6', p: 3 }}>
        <Typography variant="h6" component="h3" sx={{ fontWeight: 'semibold', color: '#4A5568', mb: 2 }}>Añadir Nueva Cuenta por Pagar</Typography>
        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={12} md={6}>
            <FormInput
              fullWidth
              label="Proveedor"
              value={supplier}
              onChange={(e) => setSupplier(e.target.value)}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <FormInput
              fullWidth
              label="Descripción"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <FormInput
              fullWidth
              type="number"
              label="Monto"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              inputProps={{ min: 0, step: 0.01 }}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <FormInput
              fullWidth
              type="date"
              label="Fecha de Vencimiento"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
        </Grid>
        <Button
          fullWidth
          variant="contained"
          sx={{
            backgroundColor: '#4F46E5', // indigo-600.
            color: 'white',
            fontWeight: 'bold',
            py: 1.5,
            borderRadius: '8px',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            transition: 'transform 0.3s ease-in-out',
            '&:hover': {
              backgroundColor: '#4338CA', // indigo-700.
              transform: 'scale(1.05)',
            },
          }}
          startIcon={<AddIcon />}
          onClick={handleAddBill}
        >
          Añadir Gasto
        </Button>
      </SectionPaper>

      {/* Lista de Cuentas por Pagar */}
      <SectionPaper sx={{ backgroundColor: '#F9FAFB', boxShadow: 3, border: '1px solid #E5E7EB', p: 3 }}>
        <Typography variant="h6" component="h3" sx={{ fontWeight: 'semibold', color: '#4A5568', mb: 2 }}>Detalle de Cuentas por Pagar</Typography>
        {accountsPayable.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic', textAlign: 'center', py: 2 }}>No hay cuentas por pagar registradas.</Typography>
        ) : (
          <TableContainer component={Paper} sx={{ borderRadius: '8px', border: '1px solid #E5E7EB', boxShadow: 2 }}>
            <Table>
              <TableHead sx={{ backgroundColor: '#F9FAFB' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'medium', color: '#6B7280' }}>Proveedor</TableCell>
                  <TableCell sx={{ fontWeight: 'medium', color: '#6B7280' }}>Descripción</TableCell>
                  <TableCell sx={{ fontWeight: 'medium', color: '#6B7280' }}>Monto</TableCell>
                  <TableCell sx={{ fontWeight: 'medium', color: '#6B7280' }}>Fecha Venc.</TableCell>
                  <TableCell sx={{ fontWeight: 'medium', color: '#6B7280' }}>Estado</TableCell>
                  <TableCell sx={{ fontWeight: 'medium', color: '#6B7280' }}>Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {accountsPayable.map((bill) => (
                  <TableRow key={bill.id}>
                    <TableCell sx={{ fontWeight: 'medium', color: '#1F2937' }}>{bill.supplier}</TableCell>
                    <TableCell sx={{ color: '#4B5563' }}>{bill.description}</TableCell>
                    <TableCell sx={{ color: '#4B5563' }}>${bill.amount.toFixed(2)}</TableCell>
                    <TableCell sx={{ color: '#4B5563' }}>{bill.dueDate}</TableCell>
                    <TableCell>
                      <Typography
                        component="span"
                        sx={{
                          px: 1.5,
                          py: 0.5,
                          borderRadius: '9999px', // rounded-full.
                          fontSize: '0.75rem', // text-xs.
                          fontWeight: 'semibold',
                          backgroundColor: bill.status === 'paid' ? '#D1FAE5' : '#FFEDD5', // emerald-100 : orange-100.
                          color: bill.status === 'paid' ? '#065F46' : '#C2410C', // emerald-800 : orange-800.
                        }}
                      >
                        {bill.status === 'paid' ? 'Pagado' : 'Pendiente'}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      {bill.status === 'pending' && (
                        <IconButton
                          color="success"
                          onClick={() => handleMarkAsPaid(bill.id)}
                          sx={{ mr: 1, transition: 'transform 0.2s', '&:hover': { transform: 'scale(1.2)' } }}
                          title="Marcar como pagado"
                        >
                          <CheckCircleIcon fontSize="small" />
                        </IconButton>
                      )}
                      <IconButton
                        color="error"
                        onClick={() => handleDeleteBill(bill.id)}
                        sx={{ transition: 'transform 0.2s', '&:hover': { transform: 'scale(1.2)' } }}
                        title="Eliminar"
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </SectionPaper>
    </SectionPaper>
  );
};

// Accounts Receivable Component
const AccountsReceivable = () => {
  const { invoices, setInvoices, setMessage } = useContext(AppContext);

  const pendingInvoices = invoices.filter(inv => inv.status === 'pending');

  const handleMarkAsPaid = (id) => {
    setInvoices(prevInvoices =>
      prevInvoices.map(inv =>
        inv.id === id ? { ...inv, status: 'paid' } : inv
      )
    );
    setMessage('Factura marcada como pagada (simulado).', 'success');
  };

  const handleDeleteInvoice = (id) => {
    setInvoices(prevInvoices => prevInvoices.filter(inv => inv.id !== id));
    setMessage('Factura eliminada (simulado).', 'info');
  };

  return (
    <SectionPaper>
      <Typography variant="h4" component="h2" sx={{ fontWeight: 'bold', mb: 3, color: '#2D3748', borderBottom: '2px solid #C7D2FE', pb: 2 }}>
        Cuentas por Cobrar (Simuladas)
      </Typography>

      <SectionPaper sx={{ backgroundColor: '#F9FAFB', boxShadow: 3, border: '1px solid #E5E7EB', p: 3 }}>
        <Typography variant="h6" component="h3" sx={{ fontWeight: 'semibold', color: '#4A5568', mb: 2 }}>Facturas Pendientes de Cobro</Typography>
        {pendingInvoices.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic', textAlign: 'center', py: 2 }}>No hay facturas pendientes de cobro.</Typography>
        ) : (
          <TableContainer component={Paper} sx={{ borderRadius: '8px', border: '1px solid #E5E7EB', boxShadow: 2 }}>
            <Table>
              <TableHead sx={{ backgroundColor: '#F9FAFB' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'medium', color: '#6B7280' }}>No. Factura</TableCell>
                  <TableCell sx={{ fontWeight: 'medium', color: '#6B7280' }}>Cliente</TableCell>
                  <TableCell sx={{ fontWeight: 'medium', color: '#6B7280' }}>Monto Total</TableCell>
                  <TableCell sx={{ fontWeight: 'medium', color: '#6B7280' }}>Fecha</TableCell>
                  <TableCell sx={{ fontWeight: 'medium', color: '#6B7280' }}>Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {pendingInvoices.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell sx={{ fontWeight: 'medium', color: '#1F2937' }}>{invoice.invoiceNumber}</TableCell>
                    <TableCell sx={{ color: '#4B5563' }}>{invoice.customerName}</TableCell>
                    <TableCell sx={{ color: '#4B5563' }}>${invoice.total.toFixed(2)}</TableCell>
                    <TableCell sx={{ color: '#4B5563' }}>{invoice.date}</TableCell>
                    <TableCell align="right">
                      <IconButton
                        color="success"
                        onClick={() => handleMarkAsPaid(invoice.id)}
                        sx={{ mr: 1, transition: 'transform 0.2s', '&:hover': { transform: 'scale(1.2)' } }}
                        title="Marcar como pagado"
                      >
                        <CheckCircleIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        color="error"
                        onClick={() => handleDeleteInvoice(invoice.id)}
                        sx={{ transition: 'transform 0.2s', '&:hover': { transform: 'scale(1.2)' } }}
                        title="Eliminar"
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </SectionPaper>
    </SectionPaper>
  );
};


// --- Main App Component ---
function App() {
  // Estado para la vista actual.
  const [currentView, setCurrentView] = useState('dashboard');
  // Estado para mensajes globales de la aplicación (éxito, error, etc.).
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('info'); // 'success', 'error', 'warning', 'info'.

  // Estado para la visibilidad de la barra lateral en móvil.
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Datos ficticios (sin Firebase).
  const [products, setProducts] = useState([
    { id: 'p1', name: 'Servicio de Consultoría', price: 50.00, stock: 999 },
    { id: 'p2', name: 'Licencia de Software', price: 120.00, stock: 500 },
    { id: 'p3', name: 'Hardware (Teclado)', price: 25.00, stock: 8 }, // Ejemplo de bajo stock
    { id: 'p4', name: 'Mantenimiento Anual', price: 300.00, stock: 999 },
  ]);
  const [invoices, setInvoices] = useState([
    { id: 'inv001', invoiceNumber: 'INV-001', customerName: 'Cliente A', total: 150.00, date: '01/05/2023', status: 'paid' },
    { id: 'inv002', invoiceNumber: 'INV-002', customerName: 'Cliente B', total: 250.00, date: '10/05/2023', status: 'pending' },
    { id: 'inv003', invoiceNumber: 'INV-003', customerName: 'Cliente C', total: 80.00, date: '15/05/2023', status: 'pending' },
  ]);
  const [accountsPayable, setAccountsPayable] = useState([
    { id: 'ap001', supplier: 'Proveedor X', description: 'Pago de arriendo', amount: 450.00, dueDate: '2023-06-15', status: 'pending' },
    { id: 'ap002', supplier: 'Proveedor Y', description: 'Compra de suministros', amount: 120.50, dueDate: '2023-05-30', status: 'paid' },
  ]);

  // Función para establecer y mostrar mensajes.
  const setMessage = (message, severity = 'info') => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

  // Cierra el Snackbar.
  const handleSnackbarClose = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbarOpen(false);
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  // Renderiza el componente activo según el estado 'currentView'.
  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard />;
      case 'invoicing':
        return <Invoicing />;
      case 'inventory':
        return <Inventory />;
      case 'accountsPayable':
        return <AccountsPayable />;
      case 'accountsReceivable':
        return <AccountsReceivable />;
      default:
        return <Dashboard />;
    }
  };

  return (
    // AppContext.Provider hace que los estados estén disponibles para todos los hijos.
    <AppContext.Provider
      value={{
        products, setProducts,
        invoices, setInvoices,
        accountsPayable, setAccountsPayable,
        setMessage, // Pasa la función setMessage de App.
      }}
    >
      <RootBox>
        {/* Botón de Hamburguesa para móvil (AppBar para la barra superior en móvil) */}
        <AppBar position="fixed" sx={{ display: { xs: 'block', lg: 'none' }, boxShadow: 3, backgroundColor: '#4F46E5' }}> {/* indigo-600 */}
          <Toolbar>
            <IconButton
              edge="start"
              color="inherit"
              aria-label="menu"
              onClick={toggleSidebar}
              sx={{ mr: 2 }}
            >
              <MenuIcon />
            </IconButton>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 'bold' }}>
              RIMPE Invoice
            </Typography>
          </Toolbar>
        </AppBar>

        {/* La Sidebar ya no necesita userId en esta versión sin Firebase */}
        <Sidebar currentView={currentView} setView={setCurrentView} toggleSidebar={toggleSidebar} isSidebarOpen={isSidebarOpen} userId={null} />

        <MainContentBox
          component="main"
          sx={{
            pt: { xs: 8, lg: 3 }, // Ajusta el padding para la AppBar en móvil.
          }}
        >
          <Container maxWidth="xl" sx={{ mt: { xs: 2, lg: 0 } }}> {/* Ajusta el margen superior */}
            {renderView()}
          </Container>
        </MainContentBox>

        {/* Snackbar Global para Mensajes */}
        <Snackbar
          open={snackbarOpen}
          autoHideDuration={5000}
          onClose={handleSnackbarClose}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert
            onClose={handleSnackbarClose}
            severity={snackbarSeverity}
            variant="filled"
            sx={{ width: '100%', boxShadow: 6 }}
          >
            {snackbarMessage}
          </Alert>
        </Snackbar>
      </RootBox>
    </AppContext.Provider>
  );
}

export default App;
