import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import type { SIPAccountFormData } from "@/types/sip";
import { TRANSPORT_OPTIONS, DEFAULT_PORTS } from "@/types/sip";

const sipAccountSchema = z.object({
  name: z.string().min(1, "Account name is required"),
  server: z.string().min(1, "Server address is required"),
  userId: z.string().min(1, "User ID is required"),
  password: z.string().min(1, "Password is required"),
  port: z.number().min(1).max(65535, "Port must be between 1 and 65535"),
  transport: z.enum(["UDP", "TCP", "TLS", "WS", "WSS"]),
  websocketPath: z.string().optional(),
  displayName: z.string().optional(),
});

interface AccountFormProps {
  onSubmit: (data: SIPAccountFormData) => void;
  onCancel?: () => void;
  initialData?: Partial<SIPAccountFormData>;
  isLoading?: boolean;
}

export function AccountForm({
  onSubmit,
  onCancel,
  initialData,
  isLoading = false,
}: AccountFormProps) {
  const form = useForm<SIPAccountFormData>({
    resolver: zodResolver(sipAccountSchema),
    defaultValues: {
      name: initialData?.name || "",
      server: initialData?.server || "",
      userId: initialData?.userId || "",
      password: initialData?.password || "",
      port: initialData?.port || DEFAULT_PORTS.WSS,
      transport: initialData?.transport || "WSS",
      websocketPath: initialData?.websocketPath || "/ws",
      displayName: initialData?.displayName || "",
    },
  });

  // Auto-update port when transport changes
  const handleTransportChange = (transport: string) => {
    const defaultPort = DEFAULT_PORTS[transport as keyof typeof DEFAULT_PORTS];
    if (defaultPort) {
      form.setValue("port", defaultPort);
    }
  };

  const handleFormSubmit = (data: SIPAccountFormData) => {
    onSubmit(data);
  };

  return (
    <div className="w-full">
      <div className="mb-6">
        <p className="text-sm text-muted-foreground">
          Configure your SIP account details to connect to your VoIP provider.
        </p>
      </div>

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(handleFormSubmit)}
          className="space-y-4"
        >
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Account Name</FormLabel>
                  <FormControl>
                    <Input placeholder="My SIP Account" {...field} />
                  </FormControl>
                  <FormDescription>
                    A friendly name to identify this account
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="server"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Server</FormLabel>
                  <FormControl>
                    <Input placeholder="sip.provider.com" {...field} />
                  </FormControl>
                  <FormDescription>
                    SIP server hostname or IP address
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="userId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>User ID</FormLabel>
                    <FormControl>
                      <Input placeholder="username" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="••••••••"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="transport"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Transport</FormLabel>
                    <Select
                      onValueChange={(value) => {
                        field.onChange(value);
                        handleTransportChange(value);
                      }}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select transport" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {TRANSPORT_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="port"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Port</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="5060"
                        {...field}
                        onChange={(e) =>
                          field.onChange(parseInt(e.target.value) || 0)
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="websocketPath"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>WebSocket Path</FormLabel>
                  <FormControl>
                    <Input placeholder="/ws" {...field} />
                  </FormControl>
                  <FormDescription>
                    WebSocket path on the server (e.g., /ws for Asterisk)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="displayName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Display Name (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="John Doe" {...field} />
                  </FormControl>
                  <FormDescription>
                    Name shown to other parties during calls
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="flex justify-between pt-4">
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            )}
            <Button type="submit" disabled={isLoading} className="ml-auto">
              {isLoading
                ? "Saving..."
                : initialData
                ? "Update Account"
                : "Add Account"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
