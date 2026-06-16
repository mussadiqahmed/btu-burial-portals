import { Request, Response } from 'express';
import { OrderService } from './order.service';

export class OrderController {
  private orderService: OrderService;

  constructor() {
    this.orderService = new OrderService();
  }

  createOrder = async (req: Request, res: Response) => {
    try {
      const order = await this.orderService.createOrder(req.body);
      res.status(201).json(order);
    } catch (error: any) {
      console.error('Error creating order:', error);
      res.status(400).json({ error: error.message || 'Internal server error' });
    }
  };

  updateOrder = async (req: Request, res: Response) => {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const order = await this.orderService.updateOrder(parseInt(id), req.body);
      res.status(200).json(order);
    } catch (error: any) {
      console.error('Error updating order:', error);
      res.status(400).json({ error: error.message || 'Internal server error' });
    }
  };

  getOrders = async (req: Request, res: Response) => {
    try {
      const username = typeof req.query.username === 'string' ? req.query.username : undefined;
      const orders = await this.orderService.getOrders(username);
      res.status(200).json(orders);
    } catch (error: any) {
      console.error('Error fetching orders:', error);
      res.status(500).json({ error: error.message || 'Internal server error' });
    }
  };

  deleteOrder = async (req: Request, res: Response) => {
    try {
      const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id);
      await this.orderService.deleteOrder(id);
      res.json({ success: true, message: 'Order deleted successfully' });
    } catch (error: any) {
      console.error('Error deleting order:', error);
      res.status(400).json({ error: error.message || 'Failed to delete order' });
    }
  };
}
