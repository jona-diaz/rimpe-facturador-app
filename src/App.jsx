// App.jsx
import React, { useState, createContext, useContext, useEffect } from 'react';
import {
  AppBar, Box, Toolbar, IconButton, Typography, Drawer,
  List, ListItem, ListItemIcon, ListItemText, Container,
  Grid, Card, CardContent, Button, TextField, Select,
  MenuItem, Table, TableBody, TableCell, TableHead,
  TableRow, Paper, Alert, Snackbar, TableContainer, CircularProgress,
  Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle,
  Autocomplete
} from '@mui/material';
import { createFilterOptions } from '@mui/material/Autocomplete'; // Importar para el filtro de Autocomplete
import {
  Menu as MenuIcon, Dashboard as DashboardIcon, Receipt as ReceiptIcon,
  Inventory as InventoryIcon, AccountBalance as AccountBalanceIcon,
  CreditCard as CreditCardIcon, Add as AddIcon, Delete as DeleteIcon,
  CheckCircle as CheckCircleIcon, Gavel as GavelIcon, People as PeopleIcon,
  Edit as EditIcon, AccountCircle as AccountCircleIcon
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';

// --- Firebase Imports ---
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, query, onSnapshot, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';

// --- Tu Configuración de Firebase (Integrada Directamente) ---
const firebaseConfig = {
  apiKey: "AIzaSyD34Yr4cjUihr--xvuZwWUGwGY4zIivJU4",
  authDomain: "rimpe-facturador.firebaseapp.com",
  projectId: "rimpe-facturador",
  storageBucket: "rimpe-facturador.firebasestorage.app",
  messagingSenderId: "271202357752",
  appId: "1:271202357752:web:14dc143219d92eda54860d",
  measurementId: "G-3LLPBJFNH1"
};

// --- Contexts for Global State Management ---
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

// Instancia del filtro de opciones para Autocomplete
const filter = createFilterOptions();


// --- Componente de Diálogo para Formulario de Cliente (Reutilizable) ---
const ClientFormDialog = ({ open, onClose, clientToEdit, setMessage, db, userId }) => {
  const [name, setName] = useState('');
  const [ruc, setRuc] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');

  // Sincroniza el estado del formulario con el cliente a editar o lo limpia
  useEffect(() => {
    if (clientToEdit) {
      setName(clientToEdit.name || '');
      setRuc(clientToEdit.ruc || '');
      setAddress(clientToEdit.address || '');
      setPhone(clientToEdit.phone || '');
      setEmail(clientToEdit.email || '');
    } else {
      // Limpia el formulario cuando el diálogo se abre para un nuevo cliente
      setName('');
      setRuc('');
      setAddress('');
      setPhone('');
      setEmail('');
    }
  }, [clientToEdit, open]); // Se restablece al cambiar el cliente a editar o al abrir/cerrar el diálogo

  // Maneja el guardado (añadir o actualizar) del cliente
  const handleSaveClient = async () => {
    if (!name || !ruc || !address) {
      setMessage('Nombre, RUC y dirección son obligatorios.', 'error');
      return;
    }

    const clientData = {
      name,
      ruc,
      address,
      phone,
      email,
      createdAt: clientToEdit ? clientToEdit.createdAt : new Date(), // Mantiene la fecha de creación original para ediciones
    };

    try {
      if (clientToEdit) {
        // Actualiza cliente existente
        const clientRef = doc(db, `users/${userId}/clients`, clientToEdit.id);
        await updateDoc(clientRef, clientData);
        setMessage('Cliente actualizado exitosamente.', 'success');
      } else {
        // Añade nuevo cliente
        await addDoc(collection(db, `users/${userId}/clients`), clientData);
        setMessage('Cliente añadido exitosamente.', 'success');
      }
      onClose(true); // Cierra y notifica éxito
    } catch (error) {
      console.error("Error al guardar cliente:", error);
      setMessage(`Error al guardar cliente: ${error.message}`, 'error');
    }
  };

  return (
    <Dialog open={open} onClose={() => onClose(false)} PaperProps={{ style: { borderRadius: 12 } }}>
      <DialogTitle sx={{ bgcolor: '#4F46E5', color: 'white', borderRadius: '12px 12px 0 0' }}>
        {clientToEdit ? 'Editar Cliente' : 'Registrar Nuevo Cliente'}
      </DialogTitle>
      <DialogContent sx={{ pt: 3, pb: 2 }}>
        <DialogContentText sx={{ mb: 2, color: 'text.secondary' }}>
          {clientToEdit ? 'Modifica los datos del cliente.' : 'Introduce los datos del nuevo cliente.'}
        </DialogContentText>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <FormInput fullWidth label="Nombre del Cliente" value={name} onChange={(e) => setName(e.target.value)} />
          </Grid>
          <Grid item xs={12} md={6}>
            <FormInput fullWidth label="RUC / C.I." value={ruc} onChange={(e) => setRuc(e.target.value)} />
          </Grid>
          <Grid item xs={12} md={6}>
            <FormInput fullWidth label="Dirección" value={address} onChange={(e) => setAddress(e.target.value)} />
          </Grid>
          <Grid item xs={12} md={6}>
            <FormInput fullWidth label="Teléfono" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </Grid>
          <Grid item xs={12}>
            <FormInput fullWidth label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={() => onClose(false)} sx={{ color: '#EF4444' }}>Cancelar</Button>
        <Button onClick={handleSaveClient} variant="contained" sx={{ bgcolor: '#4F46E5', '&:hover': { bgcolor: '#4338CA' } }}>
          {clientToEdit ? 'Actualizar' : 'Guardar'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};


// --- Components ---

// Sidebar Navigation Component
const Sidebar = ({ currentView, setView, toggleSidebar, isSidebarOpen, userId }) => {
  const navItems = [
    { id: 'dashboard', name: 'Dashboard', icon: DashboardIcon },
    { id: 'invoicing', name: 'Facturación', icon: ReceiptIcon },
    { id: 'clients', name: 'Clientes', icon: PeopleIcon },
    { id: 'inventory', name: 'Inventario', icon: InventoryIcon },
    { id: 'accountsPayable', name: 'Cuentas por Pagar', icon: AccountBalanceIcon },
    { id: 'accountsReceivable', name: 'Cuentas por Cobrar', icon: CreditCardIcon },
  ];

  const drawerContent = (
    <Box sx={{ p: 2 }}>
      <Typography variant="h5" component="h2" sx={{ fontWeight: 'bold', mb: 2, color: '#6EE7B7' }}> {/* emerald-300 */}
        RIMPE Invoice
      </Typography>
      {userId && (
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
  const { invoices, products, accountsPayable, clients } = useContext(AppContext);

  // Calcular métricas.
  const totalSales = invoices.reduce((sum, inv) => sum + inv.total, 0);
  const pendingInvoicesCount = invoices.filter(inv => inv.status === 'pending').length;
  const lowStockCount = products.filter(p => p.stock < 10).length; // Ejemplo: productos con menos de 10 unidades.
  const totalExpenses = accountsPayable.reduce((sum, item) => sum + item.amount, 0);
  const totalClients = clients.length;

  const stats = [
    { name: 'Ventas Totales (USD)', value: `$${totalSales.toFixed(2)}`, color: '#059669', bgColor: '#D1FAE5', icon: ReceiptIcon }, // emerald-600, emerald-100.
    { name: 'Facturas Pendientes', value: pendingInvoicesCount, color: '#F97316', bgColor: '#FFEDD5', icon: CreditCardIcon }, // orange-600, orange-100.
    { name: 'Productos Bajo Stock', value: lowStockCount, color: '#EF4444', bgColor: '#FEE2E2', icon: InventoryIcon }, // red-600, red-100.
    { name: 'Clientes Registrados', value: totalClients, color: '#4F46E5', bgColor: '#EEF2FF', icon: PeopleIcon }, // indigo-600, indigo-50
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

// Invoicing Component (Actualizado para usar Autocomplete de Clientes)
const Invoicing = () => {
  const { db, userId, products, setProducts, invoices, setInvoices, clients, setMessage } = useContext(AppContext);

  const [selectedClient, setSelectedClient] = useState(null); // Ahora almacena el objeto cliente, no solo el ID
  const [autocompleteInputValue, setAutocompleteInputValue] = useState(''); // Para el valor escrito en el autocompletar
  const [invoiceItems, setInvoiceItems] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [quantity, setQuantity] = useState(1);

  const [openNewClientDialog, setOpenNewClientDialog] = useState(false); // Estado para abrir el diálogo de nuevo cliente

  // Calcular totales.
  const subtotal = invoiceItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const vatRate = 0.12; // IVA de Ecuador es 12%.
  const vat = subtotal * vatRate;
  const total = subtotal + vat;

  // Maneja la selección de cliente desde el Autocomplete o la creación de uno nuevo
  const handleClientChange = (event, newValue) => {
    if (typeof newValue === 'string') {
      // El usuario escribió algo y presionó enter o el valor no está en la lista de opciones
      const existingClient = clients.find(c => c.name.toLowerCase() === newValue.toLowerCase());
      if (existingClient) {
        setSelectedClient(existingClient);
      } else {
        // Nuevo cliente escrito, abre el diálogo para crear
        setAutocompleteInputValue(newValue); // Mantiene el valor escrito para el formulario del nuevo cliente
        setOpenNewClientDialog(true);
        setSelectedClient(null); // Deseleccionar cliente si se va a crear uno nuevo
      }
    } else if (newValue && newValue.inputValue) {
      // El usuario seleccionó la opción "Registrar nuevo cliente: '...'"
      setAutocompleteInputValue(newValue.inputValue);
      setOpenNewClientDialog(true);
      setSelectedClient(null); // Deseleccionar cliente si se va a crear uno nuevo
    } else {
      // El usuario seleccionó un cliente existente del Autocomplete
      setSelectedClient(newValue);
      setAutocompleteInputValue(newValue ? newValue.name : ''); // Limpia el input si se selecciona un cliente
    }
  };

  // Autocomplete input change (el usuario está escribiendo)
  const handleAutocompleteInputChange = (event, newInputValue) => {
    setAutocompleteInputValue(newInputValue);
    if (!newInputValue) { // Si el input se borra, también se borra el cliente seleccionado
      setSelectedClient(null);
    }
  };

  // Callback después de que un nuevo cliente es creado desde el diálogo
  const handleNewClientDialogClose = (success) => {
    setOpenNewClientDialog(false);
    if (success) {
      // Después de crear exitosamente un cliente, intentar seleccionarlo en el autocompletado
      // Esto puede requerir un pequeño retraso para que el snapshot de Firestore actualice 'clients'
      setTimeout(() => {
        const newlyAddedClient = clients.find(c => c.name.toLowerCase() === autocompleteInputValue.toLowerCase());
        if (newlyAddedClient) {
          setSelectedClient(newlyAddedClient);
          setMessage(`Cliente "${newlyAddedClient.name}" creado y seleccionado.`, 'success');
        } else {
          setMessage('Cliente creado, pero no seleccionado automáticamente.', 'info');
        }
      }, 500); // Pequeño retraso para permitir que el listener de Firestore actualice el estado 'clients'
    }
    // No borrar el autocompleteInputValue aquí, se manejará cuando se seleccione o se borre el input
  };


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

  // Función para generar factura.
  const handleGenerateInvoice = async () => {
    if (!selectedClient) {
      setMessage('Por favor, selecciona un cliente o regístralo.', 'error');
      return;
    }
    if (invoiceItems.length === 0) {
      setMessage('La factura debe tener al menos un producto.', 'error');
      return;
    }

    try {
      // Simula la deducción de stock y actualiza en Firestore.
      const updatedProducts = products.map(p => {
        const soldItem = invoiceItems.find(item => item.id === p.id);
        if (soldItem) {
          // Actualiza el stock del producto en Firestore.
          const productRef = doc(db, `users/${userId}/products`, p.id);
          updateDoc(productRef, { stock: p.stock - soldItem.quantity });
          return { ...p, stock: p.stock - soldItem.quantity };
        }
        return p;
      });
      setProducts(updatedProducts); // Actualiza el estado local de productos.

      // Genera un número de factura único (simulación simple).
      const newInvoiceNumber = `INV-${Date.now().toString().slice(-6)}`;

      const newInvoice = {
        invoiceNumber: newInvoiceNumber,
        customerId: selectedClient.id, // Referencia al ID del cliente
        customerName: selectedClient.name,
        customerRUC: selectedClient.ruc,
        customerAddress: selectedClient.address,
        items: invoiceItems, // Esto se almacenará como un array de objetos en Firestore.
        subtotal: subtotal,
        vat: vat,
        total: total,
        date: new Date().toLocaleDateString('es-EC'),
        status: 'pending', // Estado por defecto.
        createdAt: new Date(), // Marca de tiempo de creación.
      };

      // Añade la nueva factura a Firestore.
      await addDoc(collection(db, `users/${userId}/invoices`), newInvoice);

      setMessage('Factura generada exitosamente. ¡Listo para enviar al SRI! (simulado)', 'success');
      console.log('Factura generada:', newInvoice); // Para revisión en consola.

      // Reinicia el formulario.
      setSelectedClient(null);
      setAutocompleteInputValue('');
      setInvoiceItems([]);
      setSelectedProduct('');
      setQuantity(1);

    } catch (error) {
      console.error("Error al generar la factura:", error);
      setMessage(`Error al generar la factura: ${error.message}`, 'error');
    }
  };

  return (
    <SectionPaper>
      <Typography variant="h4" component="h2" sx={{ fontWeight: 'bold', mb: 3, color: '#2D3748', borderBottom: '2px solid #C7D2FE', pb: 2 }}>
        Facturación Electrónica
      </Typography>

      {/* Detalles del Cliente - Ahora con Autocomplete y Diálogo de Nuevo Cliente */}
      <SectionPaper sx={{ backgroundColor: '#F9FAFB', boxShadow: 3, border: '1px solid #F3F4F6', p: 3 }}>
        <Typography variant="h6" component="h3" sx={{ fontWeight: 'semibold', color: '#4A5568', mb: 2 }}>Seleccionar Cliente</Typography>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <Autocomplete
              freeSolo // Permite escribir un valor que no está en las opciones
              options={clients}
              getOptionLabel={(option) => {
                // Para Autocomplete, si la opción es un string, es el valor escrito.
                // Si es un objeto, es un cliente seleccionado.
                if (typeof option === 'string') {
                  return option;
                }
                if (option.inputValue) { // Para la opción "Registrar nuevo cliente..."
                  return option.inputValue;
                }
                return option.name;
              }}
              filterOptions={(options, params) => {
                const filtered = filter(options, params);
                // Sugiere la creación de un nuevo cliente si el valor escrito no coincide con uno existente
                if (params.inputValue !== '' && !options.some(opt => opt.name.toLowerCase() === params.inputValue.toLowerCase())) {
                  filtered.push({
                    inputValue: params.inputValue,
                    name: `Registrar nuevo cliente: "${params.inputValue}"`,
                  });
                }
                return filtered;
              }}
              selectOnFocus // Selecciona la opción cuando se enfoca
              clearOnBlur // Limpia el input si el valor no es una opción válida y se pierde el foco
              handleHomeEndKeys // Permite navegar con teclas Home/End
              value={selectedClient} // El cliente seleccionado (objeto)
              onChange={handleClientChange} // Maneja cuando se selecciona o se escribe un valor
              onInputChange={handleAutocompleteInputChange} // Maneja cada cambio en el texto del input
              renderInput={(params) => (
                <FormInput {...params} label="Buscar o Registrar Cliente" />
              )}
            />
          </Grid>
          {selectedClient && (
            <>
              <Grid item xs={12} md={6}>
                <FormInput fullWidth label="Nombre del Cliente" value={selectedClient.name} disabled />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormInput fullWidth label="RUC / C.I." value={selectedClient.ruc} disabled />
              </Grid>
              <Grid item xs={12}>
                <FormInput fullWidth label="Dirección del Cliente" value={selectedClient.address} disabled />
              </Grid>
            </>
          )}
        </Grid>
      </SectionPaper>

      {/* Diálogo para Registrar Nuevo Cliente (cuando no se encuentra en autocomplete) */}
      {openNewClientDialog && (
        <ClientFormDialog
          open={openNewClientDialog}
          onClose={handleNewClientDialogClose}
          setMessage={setMessage}
          db={db}
          userId={userId}
          // El nombre escrito se pasa al formulario para que empiece precargado
          clientToEdit={{ name: autocompleteInputValue, ruc: '', address: '', phone: '', email: '' }}
        />
      )}

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
      <SectionPaper sx={{ backgroundColor: '#F9FAFB', boxShadow: 3, border: '1px solid #F3F4F6', p: 3 }}>
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


// Componente Clientes
const Clients = () => {
  const { db, userId, clients, setMessage } = useContext(AppContext);

  const [openDialog, setOpenDialog] = useState(false);
  const [clientToEdit, setClientToEdit] = useState(null); // Cliente que se está editando

  // Abre el diálogo para añadir o editar un cliente
  const handleOpenDialog = (client = null) => {
    setClientToEdit(client);
    setOpenDialog(true);
  };

  // Cierra el diálogo de cliente
  const handleCloseDialog = (success) => {
    setOpenDialog(false);
    setClientToEdit(null); // Limpia el cliente a editar al cerrar
  };

  // Maneja la eliminación de un cliente
  const handleDeleteClient = async (id) => {
    const confirmDelete = window.confirm("¿Estás seguro de que quieres eliminar este cliente?");
    if (!confirmDelete) {
        return;
    }

    try {
      const clientRef = doc(db, `users/${userId}/clients`, id);
      await deleteDoc(clientRef);
      setMessage('Cliente eliminado exitosamente.', 'info');
    } catch (error) {
      console.error("Error al eliminar cliente:", error);
      setMessage(`Error al eliminar cliente: ${error.message}`, 'error');
    }
  };

  return (
    <SectionPaper>
      <Typography variant="h4" component="h2" sx={{ fontWeight: 'bold', mb: 3, color: '#2D3748', borderBottom: '2px solid #C7D2FE', pb: 2 }}>
        Gestión de Clientes
      </Typography>

      {/* Botón para Añadir Nuevo Cliente */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 3 }}>
        <Button
          variant="contained"
          sx={{
            backgroundColor: '#059669', // emerald-600
            color: 'white',
            fontWeight: 'bold',
            py: 1.5,
            borderRadius: '8px',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            transition: 'transform 0.3s ease-in-out',
            '&:hover': {
              backgroundColor: '#047857', // emerald-700
              transform: 'scale(1.05)',
            },
          }}
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()} // Abre el diálogo para añadir
        >
          Añadir Nuevo Cliente
        </Button>
      </Box>

      {/* Lista de Clientes */}
      <SectionPaper sx={{ backgroundColor: '#F9FAFB', boxShadow: 3, border: '1px solid #E5E7EB', p: 3 }}>
        <Typography variant="h6" component="h3" sx={{ fontWeight: 'semibold', color: '#4A5568', mb: 2 }}>Clientes Registrados</Typography>
        {clients.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic', textAlign: 'center', py: 2 }}>No hay clientes registrados.</Typography>
        ) : (
          <TableContainer component={Paper} sx={{ borderRadius: '8px', border: '1px solid #E5E7EB', boxShadow: 2 }}>
            <Table>
              <TableHead sx={{ backgroundColor: '#F9FAFB' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'medium', color: '#6B7280' }}>Nombre</TableCell>
                  <TableCell sx={{ fontWeight: 'medium', color: '#6B7280' }}>RUC / C.I.</TableCell>
                  <TableCell sx={{ fontWeight: 'medium', color: '#6B7280' }}>Teléfono</TableCell>
                  <TableCell sx={{ fontWeight: 'medium', color: '#6B7280' }}>Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {clients.map((client) => (
                  <TableRow key={client.id}>
                    <TableCell sx={{ fontWeight: 'medium', color: '#1F2937' }}>{client.name}</TableCell>
                    <TableCell sx={{ color: '#4B5563' }}>{client.ruc}</TableCell>
                    <TableCell sx={{ color: '#4B5563' }}>{client.phone || 'N/A'}</TableCell>
                    <TableCell align="right">
                      <IconButton
                        color="primary"
                        onClick={() => handleOpenDialog(client)} // Abre el diálogo para editar
                        sx={{ mr: 1, transition: 'transform 0.2s', '&:hover': { transform: 'scale(1.2)' } }}
                        title="Editar Cliente"
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        color="error"
                        onClick={() => handleDeleteClient(client.id)}
                        sx={{ transition: 'transform 0.2s', '&:hover': { transform: 'scale(1.2)' } }}
                        title="Eliminar Cliente"
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

      {/* Diálogo para Añadir/Editar Cliente */}
      <ClientFormDialog
        open={openDialog}
        onClose={handleCloseDialog}
        clientToEdit={clientToEdit}
        setMessage={setMessage}
        db={db}
        userId={userId}
      />
    </SectionPaper>
  );
};


// Inventory Component
const Inventory = () => {
  const { db, userId, products, setProducts, setMessage } = useContext(AppContext);
  const [productName, setProductName] = useState('');
  const [productPrice, setProductPrice] = useState(0);
  const [productStock, setProductStock] = useState(0);

  const handleAddProduct = async () => {
    if (!productName || productPrice <= 0 || productStock < 0) {
      setMessage('Por favor, completa todos los campos del producto y asegúrate que el precio y stock sean válidos.', 'error');
      return;
    }
    try {
      const newProduct = {
        name: productName,
        price: parseFloat(productPrice),
        stock: parseInt(productStock),
        createdAt: new Date(), // Marca de tiempo.
      };
      await addDoc(collection(db, `users/${userId}/products`), newProduct); // Ruta ajustada.
      setMessage('Producto añadido exitosamente.', 'success');
      setProductName('');
      setProductPrice(0);
      setProductStock(0);
    } catch (error) {
      console.error("Error al añadir producto:", error);
      setMessage(`Error al añadir producto: ${error.message}`, 'error');
    }
  };

  const handleUpdateStock = async (id, newStock) => {
    try {
      const productRef = doc(db, `users/${userId}/products`, id); // Ruta ajustada.
      await updateDoc(productRef, { stock: Math.max(0, parseInt(newStock) || 0) });
      setMessage('Stock actualizado.', 'info');
    } catch (error) {
      console.error("Error al actualizar stock:", error);
      setMessage(`Error al actualizar stock: ${error.message}`, 'error');
    }
  };

  const handleDeleteProduct = async (id) => {
    try {
      const productRef = doc(db, `users/${userId}/products`, id); // Ruta ajustada.
      await deleteDoc(productRef);
      setMessage('Producto eliminado.', 'info');
    } catch (error) {
      console.error("Error al eliminar producto:", error);
      setMessage(`Error al eliminar producto: ${error.message}`, 'error');
    }
  };

  return (
    <SectionPaper>
      <Typography variant="h4" component="h2" sx={{ fontWeight: 'bold', mb: 3, color: '#2D3748', borderBottom: '2px solid #C7D2FE', pb: 2 }}>
        Gestión de Inventario
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
  const { db, userId, accountsPayable, setAccountsPayable, setMessage } = useContext(AppContext);
  const [supplier, setSupplier] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState(0);
  const [dueDate, setDueDate] = useState('');

  const handleAddBill = async () => {
    if (!supplier || !description || amount <= 0 || !dueDate) {
      setMessage('Por favor, completa todos los campos de la cuenta por pagar.', 'error');
      return;
    }
    try {
      const newBill = {
        supplier,
        description,
        amount: parseFloat(amount),
        dueDate,
        status: 'pending',
        createdAt: new Date(),
      };
      await addDoc(collection(db, `users/${userId}/accountsPayable`), newBill); // Ruta ajustada.
      setMessage('Cuenta por pagar añadida.', 'success');
      setSupplier('');
      setDescription('');
      setAmount(0);
      setDueDate('');
    } catch (error) {
      console.error("Error al añadir cuenta por pagar:", error);
      setMessage(`Error al añadir cuenta por pagar: ${error.message}`, 'error');
    }
  };

  const handleMarkAsPaid = async (id) => {
    try {
      const billRef = doc(db, `users/${userId}/accountsPayable`, id); // Ruta ajustada.
      await updateDoc(billRef, { status: 'paid' });
      setMessage('Cuenta por pagar marcada como pagada.', 'success');
    } catch (error) {
      console.error("Error al marcar como pagada:", error);
      setMessage(`Error al marcar como pagada: ${error.message}`, 'error');
    }
  };

  const handleDeleteBill = async (id) => {
    try {
      const billRef = doc(db, `users/${userId}/accountsPayable`, id); // Ruta ajustada.
      await deleteDoc(billRef);
      setMessage('Cuenta por pagar eliminada.', 'info');
    } catch (error) {
      console.error("Error al eliminar cuenta por pagar:", error);
      setMessage(`Error al eliminar cuenta por pagar: ${error.message}`, 'error');
    }
  };

  return (
    <SectionPaper>
      <Typography variant="h4" component="h2" sx={{ fontWeight: 'bold', mb: 3, color: '#2D3748', borderBottom: '2px solid #C7D2FE', pb: 2 }}>
        Cuentas por Pagar
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
      <SectionPaper sx={{ backgroundColor: '#F9FAFB', boxShadow: 3, border: '1px solid #F3F4F6', p: 3 }}>
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
  const { db, userId, invoices, setInvoices, setMessage } = useContext(AppContext);

  const pendingInvoices = invoices.filter(inv => inv.status === 'pending');

  const handleMarkAsPaid = async (id) => {
    try {
      const invoiceRef = doc(db, `users/${userId}/invoices`, id); // Ruta ajustada.
      await updateDoc(invoiceRef, { status: 'paid' });
      setMessage('Factura marcada como pagada.', 'success');
    } catch (error) {
      console.error("Error al marcar factura como pagada:", error);
      setMessage(`Error al marcar factura como pagada: ${error.message}`, 'error');
    }
  };

  const handleDeleteInvoice = async (id) => {
    try {
      const invoiceRef = doc(db, `users/${userId}/invoices`, id); // Ruta ajustada.
      await deleteDoc(invoiceRef);
      setMessage('Factura eliminada.', 'info');
    } catch (error) {
      console.error("Error al eliminar factura:", error);
      setMessage(`Error al eliminar factura: ${error.message}`, 'error');
    }
  };

  return (
    <SectionPaper>
      <Typography variant="h4" component="h2" sx={{ fontWeight: 'bold', mb: 3, color: '#2D3748', borderBottom: '2px solid #C7D2FE', pb: 2 }}>
        Cuentas por Cobrar
      </Typography>

      <SectionPaper sx={{ backgroundColor: '#F9FAFB', boxShadow: 3, border: '1px solid #F3F4F6', p: 3 }}>
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

  // Estados de Firebase.
  const [db, setDb] = useState(null);
  const [auth, setAuth] = useState(null);
  const [userId, setUserId] = useState(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);

  // Función para establecer y mostrar mensajes.
  const setMessage = (message, severity = 'info') => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

  // Estado para la visibilidad de la barra lateral en móvil.
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Estados de los datos, ahora poblados desde Firestore.
  const [products, setProducts] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [accountsPayable, setAccountsPayable] = useState([]);
  const [clients, setClients] = useState([]); // Estado para clientes

  // Inicializa Firebase y Autentica.
  useEffect(() => {
    try {
      // Inicializa Firebase con la configuración proporcionada directamente.
      const app = initializeApp(firebaseConfig);
      const firestoreDb = getFirestore(app);
      const firebaseAuthInstance = getAuth(app); // Renombrada para evitar conflicto con el estado 'auth'.

      setDb(firestoreDb);
      setAuth(firebaseAuthInstance);

      // Escucha los cambios en el estado de autenticación.
      const unsubscribeAuth = onAuthStateChanged(firebaseAuthInstance, async (user) => {
        if (user) {
          setUserId(user.uid);
          setIsAuthReady(true);
        } else {
          // Si no hay usuario, intenta iniciar sesión de forma anónima.
          try {
            await signInAnonymously(firebaseAuthInstance);
          } catch (anonError) {
            console.error("Error al iniciar sesión anónimamente:", anonError);
            setMessage(`Error de autenticación: ${anonError.message}`, 'error');
            setIsLoadingData(false);
          }
        }
      });

      return () => {
        unsubscribeAuth();
      };
    } catch (error) {
      console.error("Error al inicializar Firebase:", error);
      setMessage(`Error al inicializar Firebase: ${error.message}`, 'error');
      setIsLoadingData(false);
    }
  }, []); // Se ejecuta solo una vez al montar el componente.

  // Obtiene datos de Firestore una vez autenticado.
  useEffect(() => {
    if (db && userId && isAuthReady) {
      setIsLoadingData(true);

      // Listener para Productos.
      const unsubscribeProducts = onSnapshot(
        collection(db, `users/${userId}/products`), // Ruta ajustada.
        (snapshot) => {
          const fetchedProducts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setProducts(fetchedProducts);
          setIsLoadingData(false);
        },
        (error) => {
          console.error("Error al cargar productos:", error);
          setMessage(`Error al cargar productos: ${error.message}`, 'error');
          setIsLoadingData(false);
        }
      );

      // Listener para Facturas.
      const unsubscribeInvoices = onSnapshot(
        collection(db, `users/${userId}/invoices`), // Ruta ajustada.
        (snapshot) => {
          const fetchedInvoices = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setInvoices(fetchedInvoices);
          setIsLoadingData(false);
        },
        (error) => {
          console.error("Error al cargar facturas:", error);
          setMessage(`Error al cargar facturas: ${error.message}`, 'error');
          setIsLoadingData(false);
        }
      );

      // Listener para Cuentas por Pagar.
      const unsubscribeAccountsPayable = onSnapshot(
        collection(db, `users/${userId}/accountsPayable`), // Ruta ajustada.
        (snapshot) => {
          const fetchedAccountsPayable = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setAccountsPayable(fetchedAccountsPayable);
          setIsLoadingData(false);
        },
        (error) => {
          console.error("Error al cargar cuentas por pagar:", error);
          setMessage(`Error al cargar cuentas por pagar: ${error.message}`, 'error');
          setIsLoadingData(false);
        }
      );

      // Listener para Clientes.
      const unsubscribeClients = onSnapshot(
        collection(db, `users/${userId}/clients`), // Nueva colección para clientes.
        (snapshot) => {
          const fetchedClients = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setClients(fetchedClients);
          setIsLoadingData(false);
        },
        (error) => {
          console.error("Error al cargar clientes:", error);
          setMessage(`Error al cargar clientes: ${error.message}`, 'error');
          setIsLoadingData(false);
        }
      );


      // Limpia los listeners al desmontar el componente o si el userId cambia.
      return () => {
        unsubscribeProducts();
        unsubscribeInvoices();
        unsubscribeAccountsPayable();
        unsubscribeClients(); // Limpiar el listener de clientes.
      };
    } else if (!isAuthReady) {
      // Si la autenticación no está lista, la carga de datos continúa.
      setIsLoadingData(true);
    }
  }, [db, userId, isAuthReady]); // Se ejecuta cuando db, userId, o el estado de auth cambia.

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
    if (isLoadingData) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
          <CircularProgress size={60} sx={{ color: '#4F46E5' }} />
          <Typography variant="h6" sx={{ ml: 2, color: '#4A5563' }}>Cargando datos...</Typography>
        </Box>
      );
    }

    if (!db || !userId) {
      return (
        <Alert severity="error" sx={{ m: 4 }}>
          No se pudo conectar a la base de datos o el usuario no está autenticado. Por favor, revisa tu configuración de Firebase y las reglas de seguridad.
        </Alert>
      );
    }

    switch (currentView) {
      case 'dashboard':
        return <Dashboard />;
      case 'invoicing':
        return <Invoicing />;
      case 'clients': // Nueva vista de clientes
        return <Clients />;
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
    // AppContext.Provider hace que los estados y las instancias de Firebase estén disponibles para todos los hijos.
    <AppContext.Provider
      value={{
        db, // Instancia de Firebase Firestore.
        auth, // Instancia de Firebase Auth.
        userId, // ID del usuario autenticado actual.
        products, setProducts,
        invoices, setInvoices,
        accountsPayable, setAccountsPayable,
        clients, setClients, // Añadir clientes al contexto.
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

        <Sidebar currentView={currentView} setView={setCurrentView} toggleSidebar={toggleSidebar} isSidebarOpen={isSidebarOpen} userId={userId} />

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
